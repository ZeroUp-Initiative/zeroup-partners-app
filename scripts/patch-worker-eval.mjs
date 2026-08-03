// protobufjs (pulled in transitively by firebase-admin's Firestore client) generates
// encoder/decoder functions from strings at module-init time via @protobufjs/codegen.
// Cloudflare Workers disallows dynamic code generation (new Function/eval) outside a
// narrow startup window, so this crashes every request that reaches the bundle path
// — even ones that never touch Firestore. There is no upstream fix yet
// (https://github.com/opennextjs/opennextjs-cloudflare/issues/1301); this patches the
// generated Worker bundle to fail soft instead of crashing the whole request.
//
// Falling back to a no-op here means protobufjs-generated encoders/decoders won't run
// correctly if actually invoked — i.e. firebase-admin Firestore calls may throw instead
// of crashing the worker. Routes that already have a REST-API fallback (see
// lib/auth/verify-admin.ts) degrade gracefully; others will surface as a caught 500 from
// that specific route instead of taking down every request.

import { readFileSync, writeFileSync } from 'node:fs'

const targets = [
  '.open-next/server-functions/default/handler.mjs',
  '.open-next/middleware/handler.mjs',
]

for (const path of targets) {
  let content
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    continue
  }

  const before = content

  content = content.replace(
    /Function\.apply\(null,(\w+)\)\.apply\(null,(\w+)\)/g,
    '(function(){try{return Function.apply(null,$1).apply(null,$2)}catch(e){return function(){}}})()'
  )
  content = content.replace(
    /return Function\((\w+)\)\(\)/g,
    'return(function(){try{return Function($1)()}catch(e){return function(){}}})()'
  )

  if (content !== before) {
    writeFileSync(path, content)
    console.log(`[patch-worker-eval] patched ${path}`)
  }
}
