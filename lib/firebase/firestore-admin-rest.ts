import 'server-only'
import { getServiceAccountAccessToken, getServiceAccountProjectId } from './sa-token'

// Drop-in replacement for the subset of the firebase-admin Firestore SDK's
// chainable API that this app uses (collection/doc/where/orderBy/limit/count/
// get/set/update/delete/create/add/runTransaction), backed by the Firestore
// REST API instead of the Admin SDK's gRPC client. Authenticates as the
// service account (same elevated, security-rules-bypassing access the Admin
// SDK had) via a minted OAuth2 access token — see sa-token.ts.
//
// Why this exists instead of using firebase-admin directly: firebase-admin's
// Firestore client pulls in protobufjs, which generates JS functions from
// strings at module load time. Cloudflare Workers disallows dynamic code
// generation, so importing firebase-admin crashes every request that reaches
// it — see https://github.com/opennextjs/opennextjs-cloudflare/issues/1301.

function base(): string {
  const id = getServiceAccountProjectId()
  return `https://firestore.googleapis.com/v1/projects/${id}/databases/(default)/documents`
}

class FsTimestamp {
  constructor(private iso: string) {}
  toDate(): Date {
    return new Date(this.iso)
  }
  toMillis(): number {
    return new Date(this.iso).getTime()
  }
  toJSON(): string {
    return this.iso
  }
}

function encodeValue(val: unknown): unknown {
  if (val === null || val === undefined) return { nullValue: null }
  if (val instanceof Date) return { timestampValue: val.toISOString() }
  if (typeof val === 'boolean') return { booleanValue: val }
  if (typeof val === 'number')
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val }
  if (typeof val === 'string') return { stringValue: val }
  if (Array.isArray(val)) return { arrayValue: { values: val.map(encodeValue) } }
  if (typeof val === 'object') return { mapValue: { fields: encodeFields(val as Record<string, unknown>) } }
  return { stringValue: String(val) }
}

function encodeFields(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, encodeValue(v)]))
}

function decodeValue(val: Record<string, unknown>): unknown {
  if ('stringValue' in val) return val.stringValue
  if ('booleanValue' in val) return val.booleanValue
  if ('integerValue' in val) return Number(val.integerValue)
  if ('doubleValue' in val) return val.doubleValue
  if ('timestampValue' in val) return new FsTimestamp(val.timestampValue as string)
  if ('nullValue' in val) return null
  if ('mapValue' in val) return decodeFields(((val.mapValue as any)?.fields ?? {}) as Record<string, unknown>)
  if ('arrayValue' in val) return ((val.arrayValue as any)?.values ?? []).map(decodeValue)
  if ('referenceValue' in val) return docIdFromName(val.referenceValue as string)
  return null
}

function decodeFields(fields: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v as Record<string, unknown>)]))
}

function docIdFromName(name: string): string {
  return name.split('/').pop()!
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getServiceAccountAccessToken()
  if (!token) throw new Error('Firebase service account not configured or token mint failed.')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export class DocSnapshot {
  constructor(
    public readonly id: string,
    private readonly _data: Record<string, unknown> | undefined,
    public readonly exists: boolean,
  ) {}
  data(): Record<string, unknown> | undefined {
    return this._data
  }
}

class QuerySnapshot {
  constructor(public readonly docs: DocSnapshot[]) {}
  get empty(): boolean {
    return this.docs.length === 0
  }
  forEach(cb: (doc: DocSnapshot) => void): void {
    this.docs.forEach(cb)
  }
}

interface Filter {
  field: string
  op: string
  value: unknown
}
interface OrderBy {
  field: string
  dir: 'ASCENDING' | 'DESCENDING'
}

const OP_MAP: Record<string, string> = {
  '==': 'EQUAL',
  '!=': 'NOT_EQUAL',
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  'array-contains': 'ARRAY_CONTAINS',
  in: 'IN',
  'array-contains-any': 'ARRAY_CONTAINS_ANY',
}

function buildStructuredQuery(collectionPath: string, filters: Filter[], orderBy: OrderBy[], limitN?: number) {
  const structuredQuery: Record<string, unknown> = { from: [{ collectionId: collectionPath }] }

  if (filters.length === 1) {
    structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: filters[0].field },
        op: OP_MAP[filters[0].op] ?? 'EQUAL',
        value: encodeValue(filters[0].value),
      },
    }
  } else if (filters.length > 1) {
    structuredQuery.where = {
      compositeFilter: {
        op: 'AND',
        filters: filters.map((f) => ({
          fieldFilter: {
            field: { fieldPath: f.field },
            op: OP_MAP[f.op] ?? 'EQUAL',
            value: encodeValue(f.value),
          },
        })),
      },
    }
  }

  if (orderBy.length > 0) {
    structuredQuery.orderBy = orderBy.map((o) => ({ field: { fieldPath: o.field }, direction: o.dir }))
  }
  if (typeof limitN === 'number') {
    structuredQuery.limit = limitN
  }
  return structuredQuery
}

class AggregateQuery {
  constructor(private q: Query) {}
  async get(): Promise<{ data: () => { count: number } }> {
    const headers = await authHeaders()
    const structuredQuery = buildStructuredQuery(this.q.collectionPath, this.q.filters, this.q.orderings, this.q.limitN)
    const res = await fetch(`${base()}:runAggregationQuery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredAggregationQuery: { structuredQuery, aggregations: [{ alias: 'count', count: {} }] },
      }),
    })
    if (!res.ok) return { data: () => ({ count: 0 }) }
    const json = (await res.json()) as any[]
    const count = Number(json?.[0]?.result?.aggregateFields?.count?.integerValue ?? 0)
    return { data: () => ({ count }) }
  }
}

export class Query {
  constructor(
    public readonly collectionPath: string,
    public readonly filters: Filter[] = [],
    public readonly orderings: OrderBy[] = [],
    public readonly limitN?: number,
  ) {}

  where(field: string, op: string, value: unknown): Query {
    return new Query(this.collectionPath, [...this.filters, { field, op, value }], this.orderings, this.limitN)
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): Query {
    const d: OrderBy = { field, dir: dir === 'desc' ? 'DESCENDING' : 'ASCENDING' }
    return new Query(this.collectionPath, this.filters, [...this.orderings, d], this.limitN)
  }

  limit(n: number): Query {
    return new Query(this.collectionPath, this.filters, this.orderings, n)
  }

  count(): AggregateQuery {
    return new AggregateQuery(this)
  }

  async get(): Promise<QuerySnapshot> {
    const headers = await authHeaders()
    const structuredQuery = buildStructuredQuery(this.collectionPath, this.filters, this.orderings, this.limitN)
    const res = await fetch(`${base()}:runQuery`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ structuredQuery }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Firestore query failed (${res.status}): ${body}`)
    }
    const results = (await res.json()) as any[]
    const docs = results
      .filter((r) => r.document)
      .map((r) => new DocSnapshot(docIdFromName(r.document.name), decodeFields(r.document.fields ?? {}), true))
    return new QuerySnapshot(docs)
  }
}

export class DocRef {
  constructor(
    public readonly collectionPath: string,
    public readonly id: string,
  ) {}

  get path(): string {
    return `${this.collectionPath}/${this.id}`
  }

  async get(): Promise<DocSnapshot> {
    const headers = await authHeaders()
    const res = await fetch(`${base()}/${this.path}`, { headers })
    if (res.status === 404) return new DocSnapshot(this.id, undefined, false)
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Firestore get failed (${res.status}): ${body}`)
    }
    const json = await res.json()
    return new DocSnapshot(this.id, decodeFields(json.fields ?? {}), true)
  }

  async set(data: Record<string, unknown>, opts?: { merge?: boolean }): Promise<void> {
    const headers = await authHeaders()
    const query = opts?.merge
      ? '?' + Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
      : ''
    const res = await fetch(`${base()}/${this.path}${query}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: encodeFields(data) }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Firestore set failed (${res.status}): ${body}`)
    }
  }

  async update(data: Record<string, unknown>): Promise<void> {
    const headers = await authHeaders()
    const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join('&')
    const res = await fetch(`${base()}/${this.path}?${mask}&currentDocument.exists=true`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: encodeFields(data) }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Firestore update failed (${res.status}): ${body}`)
    }
  }

  async create(data: Record<string, unknown>): Promise<void> {
    const headers = await authHeaders()
    const res = await fetch(`${base()}:commit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        writes: [
          {
            update: { name: `${docsPrefix()}/${this.path}`, fields: encodeFields(data) },
            currentDocument: { exists: false },
          },
        ],
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Firestore create failed (${res.status}): ${body}`)
    }
  }

  async delete(): Promise<void> {
    const headers = await authHeaders()
    const res = await fetch(`${base()}/${this.path}`, { method: 'DELETE', headers })
    if (!res.ok && res.status !== 404) {
      const body = await res.text()
      throw new Error(`Firestore delete failed (${res.status}): ${body}`)
    }
  }
}

function docsPrefix(): string {
  return `projects/${getServiceAccountProjectId()}/databases/(default)/documents`
}

function randomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export class CollectionRef extends Query {
  constructor(collectionPath: string) {
    super(collectionPath)
  }

  doc(id?: string): DocRef {
    return new DocRef(this.collectionPath, id ?? randomId())
  }

  async add(data: Record<string, unknown>): Promise<DocRef> {
    const headers = await authHeaders()
    const res = await fetch(`${base()}/${this.collectionPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields: encodeFields(data) }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Firestore add failed (${res.status}): ${body}`)
    }
    const json = await res.json()
    return new DocRef(this.collectionPath, docIdFromName(json.name))
  }
}

interface Transaction {
  get(ref: DocRef): Promise<DocSnapshot>
  set(ref: DocRef, data: Record<string, unknown>): void
  update(ref: DocRef, data: Record<string, unknown>): void
  delete(ref: DocRef): void
}

export async function runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  const headers = await authHeaders()
  const beginRes = await fetch(`${base()}:beginTransaction`, { method: 'POST', headers, body: JSON.stringify({}) })
  if (!beginRes.ok) {
    throw new Error(`Firestore beginTransaction failed (${beginRes.status}): ${await beginRes.text()}`)
  }
  const { transaction } = (await beginRes.json()) as { transaction: string }

  const writes: unknown[] = []
  const tx: Transaction = {
    get: async (ref) => {
      const res = await fetch(`${base()}/${ref.path}?transaction=${encodeURIComponent(transaction)}`, { headers })
      if (res.status === 404) return new DocSnapshot(ref.id, undefined, false)
      if (!res.ok) throw new Error(`Firestore transaction get failed (${res.status}): ${await res.text()}`)
      const json = await res.json()
      return new DocSnapshot(ref.id, decodeFields(json.fields ?? {}), true)
    },
    set: (ref, data) => {
      writes.push({ update: { name: `${docsPrefix()}/${ref.path}`, fields: encodeFields(data) } })
    },
    update: (ref, data) => {
      writes.push({
        update: { name: `${docsPrefix()}/${ref.path}`, fields: encodeFields(data) },
        updateMask: { fieldPaths: Object.keys(data) },
        currentDocument: { exists: true },
      })
    },
    delete: (ref) => {
      writes.push({ delete: `${docsPrefix()}/${ref.path}` })
    },
  }

  let result: T
  try {
    result = await fn(tx)
  } catch (err) {
    await fetch(`${base()}:rollback`, { method: 'POST', headers, body: JSON.stringify({ transaction }) }).catch(() => {})
    throw err
  }

  if (writes.length > 0) {
    const commitRes = await fetch(`${base()}:commit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ writes, transaction }),
    })
    if (!commitRes.ok) {
      throw new Error(`Firestore transaction commit failed (${commitRes.status}): ${await commitRes.text()}`)
    }
  } else {
    await fetch(`${base()}:rollback`, { method: 'POST', headers, body: JSON.stringify({ transaction }) }).catch(() => {})
  }

  return result
}

export class FirestoreRestDb {
  collection(name: string): CollectionRef {
    return new CollectionRef(name)
  }
  runTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    return runTransaction(fn)
  }
}
