"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Target, Award, Globe, Heart, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="header-glass sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image src="/images/zeroup-partners-logo.png" alt="ZeroUp Partners" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Partners Hub</h1>
                <p className="text-sm text-muted-foreground">ZeroUp Initiative</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#about"
                className="text-muted-foreground hover:text-foreground transition-colors hover:text-[var(--neon-blue)]"
              >
                About
              </Link>
              <Link
                href="#impact"
                className="text-muted-foreground hover:text-foreground transition-colors hover:text-[var(--neon-blue)]"
              >
                Impact
              </Link>
              <Link
                href="#partners"
                className="text-muted-foreground hover:text-foreground transition-colors hover:text-[var(--neon-blue)]"
              >
                Partners
              </Link>
              <ThemeToggle />
              <Button asChild className="btn-neon neon-glow-blue">
                <Link href="/login">Partner Login</Link>
              </Button>
            </nav>
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 gradient-hero relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-in-up">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit glass-card">
                  <Globe className="w-4 h-4 mr-2" />
                  ZeroUp Initiative
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-balance leading-tight text-white">
                  Empowering partners to drive <span className="gradient-text">meaningful change</span>
                </h1>
                <p className="text-xl text-white/90 text-pretty leading-relaxed">
                  Join our community of dedicated partners tracking contributions, celebrating milestones, and creating
                  lasting impact through the Partners Hub.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg px-8 btn-neon bg-white text-black hover:bg-white/90">
                  <Link href="/signup">
                    Become a Partner
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="text-lg px-8 glass-card text-white border-white/30 hover:bg-white/10 bg-transparent"
                >
                  <Link href="#impact">View Impact</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "2,500+", label: "Active Partners", glow: "neon-glow-blue" },
                { value: "$1.2M", label: "Total Contributions", glow: "neon-glow-purple" },
                { value: "150+", label: "Projects Funded", glow: "neon-glow-teal" },
                { value: "95%", label: "Impact Rate", glow: "neon-glow-green" },
              ].map((stat, index) => (
                <Card
                  key={index}
                  className={`
                    glass-card ${stat.glow} card-hover-effect float-animation text-white
                    ${index === 1 || index === 3 ? "mt-8" : index === 2 ? "-mt-4" : ""}
                    animate-slide-in-up-delay-${index + 1}
                  `}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-2xl font-bold text-white">{stat.value}</CardTitle>
                    <CardDescription className="text-white/80">{stat.label}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16 animate-slide-in-up">
            <h2 className="text-4xl font-bold text-balance">
              Built for partners who care about <span className="gradient-text">real impact</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Track your contributions, celebrate milestones, and see the direct impact of your partnership with
              transparent analytics and reporting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Contribution Tracking",
                description:
                  "Log monthly contributions with proof of payment and track your partnership journey over time.",
                glow: "neon-glow-blue",
              },
              {
                icon: Target,
                title: "Impact Analytics",
                description:
                  "View detailed dashboards showing how your contributions drive real change and measurable outcomes.",
                glow: "neon-glow-purple",
              },
              {
                icon: Award,
                title: "Recognition System",
                description:
                  "Earn badges and milestones as you reach contribution goals and celebrate achievements with the community.",
                glow: "neon-glow-teal",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className={`glass-card ${feature.glow} card-hover-effect h-full animate-slide-in-up-delay-${index + 1}`}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8 animate-slide-in-up">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-balance">Ready to make a difference?</h2>
              <p className="text-xl text-muted-foreground text-pretty">
                Join thousands of partners already making an impact through the ZeroUp Initiative.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 btn-neon neon-glow-blue">
                <Link href="/signup">
                  Start Your Partnership
                  <Heart className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 glass-card bg-transparent">
                <Link href="/login">Existing Partner Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <Image
                    src="/images/zeroup-initiative-logo.png"
                    alt="ZeroUp Initiative"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold">ZeroUp Initiative</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering partners to create meaningful change through the Partners Hub.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link
                  href="/contributions"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contributions
                </Link>
                <Link href="/analytics" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Community</h4>
              <div className="space-y-2 text-sm">
                <Link href="/partners" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Partners
                </Link>
                <Link
                  href="/leaderboard"
                  className="block text-muted-foreground hover:text-foreground transition-colors"
                >
                  Leaderboard
                </Link>
                <Link href="/bridge-ai" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Bridge AI
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <Link href="/help" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
                <Link href="/resources" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Resources
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ZeroUp Initiative. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
