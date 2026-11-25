'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, School, MapPin } from 'lucide-react'
import type { Project } from '@/lib/types'

interface SchoolListing {
  id: string
  schoolName: string
  schoolAddress?: string
  casesPublished: number
  totalRaised: number
}

function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolListing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'school')), (userSnap) => {
      const approvedSchools = userSnap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) }))
        .filter(u => u.schoolStatus === 'approved')

      const unsubProjects = onSnapshot(collection(db, 'projects'), (projectSnap) => {
        const projects: Project[] = []
        projectSnap.forEach(d => {
          const data = d.data()
          if (['open', 'fully-funded', 'closed'].includes(data.status)) {
            projects.push({ id: d.id, ...(data as any) })
          }
        })

        const listings: SchoolListing[] = approvedSchools.map(s => {
          const schoolProjects = projects.filter(p => p.schoolName === s.schoolName)
          return {
            id: s.id,
            schoolName: s.schoolName || 'Partner School',
            schoolAddress: s.schoolAddress,
            casesPublished: schoolProjects.length,
            totalRaised: schoolProjects.reduce((sum, p) => sum + (p.currentFunding || 0), 0),
          }
        })
        listings.sort((a, b) => b.casesPublished - a.casesPublished)
        setSchools(listings)
        setIsLoading(false)
      })
      return unsubProjects
    })
    return () => unsubUsers()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
        </Link>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Partner Schools</h1>
        <p className="text-base sm:text-lg text-muted-foreground mt-2">Schools we've onboarded and verified — bringing real, specific student needs to partners.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader></Card>
          ))}
        </div>
      ) : schools.length === 0 ? (
        <div className="text-center py-16">
          <School className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No partner schools yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-editorial-navy/10 flex items-center justify-center flex-shrink-0">
                    <School className="w-5 h-5 text-editorial-navy dark:text-editorial-cream" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{s.schoolName}</CardTitle>
                    {s.schoolAddress && (
                      <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
                        <MapPin className="w-3 h-3" /> {s.schoolAddress}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-lg font-bold">{s.casesPublished}</p>
                    <p className="text-xs text-muted-foreground">Cases Live</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-lg font-bold">₦{s.totalRaised.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Raised</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProtectedSchoolsPage() {
  return (
    <ProtectedRoute>
      <SchoolsPage />
    </ProtectedRoute>
  )
}
