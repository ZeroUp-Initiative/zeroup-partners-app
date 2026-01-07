"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, Target, Award, Globe, Heart, Menu, Users, CheckCircle, MessageSquare, Zap, Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/firebase/client";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function HomePage() {
  const [totalContributions, setTotalContributions] = useState(0);
  const [partnerCount, setPartnerCount] = useState(0);
  const [fundedProjectsCount, setFundedProjectsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listener for total contributions
    const paymentsQuery = query(collection(db, "payments"), where("status", "==", "approved"));
    const unsubscribePayments = onSnapshot(paymentsQuery, (querySnapshot) => {
      let total = 0;
      querySnapshot.forEach((doc) => {
        total += doc.data().amount;
      });
      setTotalContributions(total);
    });

    // Listener for total partners (users)
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      setPartnerCount(querySnapshot.size);
    });

    // Listener for fully funded projects
    const projectsQuery = query(collection(db, "projects"), where("status", "==", "fully-funded"));
    const unsubscribeProjects = onSnapshot(projectsQuery, (querySnapshot) => {
      setFundedProjectsCount(querySnapshot.size);
    });
    
    setIsLoading(false);

    // Cleanup listeners on component unmount
    return () => {
      unsubscribePayments();
      unsubscribeUsers();
      unsubscribeProjects();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Header */}
      <header className="header-glass sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                   <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                   <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
                      <span className="text-primary-foreground font-bold text-xl">Z</span>
                   </div>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground leading-tight">Partners Hub</h1>
                  <p className="text-xs text-muted-foreground">ZeroUp Initiative</p>
                </div>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5">
                Benefits
              </Link>
              <Link href="#process" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5">
                Process
              </Link>
               <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5">
                Testimonials
              </Link>
              <Link href="/projects" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all hover:-translate-y-0.5">
                Projects
              </Link>
            </nav>
            <div className="flex items-center gap-4">
               <ThemeToggle />
               <div className="hidden md:flex gap-3">
                  <Button variant="ghost" asChild className="hover:bg-primary/5">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                    <Link href="/signup">Join Now</Link>
                  </Button>
               </div>
                <div className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 gradient-hero relative overflow-hidden flex items-center min-h-[90vh]">
        <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-slide-in-up">
              <div className="space-y-6">
                <Badge variant="secondary" className="glass-card px-4 py-1.5 text-sm backdrop-blur-md border-white/20 text-white">
                  <Globe className="w-3.5 h-3.5 mr-2" />
                  Global Impact Network
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold text-balance leading-tight text-white tracking-tight">
                  Drive meaningful <br/>
                  <span className="gradient-text drop-shadow-sm">global change</span>
                </h1>
                <p className="text-xl text-white/80 text-pretty leading-relaxed max-w-lg">
                  Join a community of visionaries. Track your impact, fund transformative projects, and celebrate every milestone with transparent analytics.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild className="text-lg px-8 py-6 h-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/10 btn-modern">
                  <Link href="/signup">
                    Become a Partner
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="text-lg px-8 py-6 h-auto glass-card text-white border-white/20 hover:bg-white/10 hover:border-white/40 transition-all"
                >
                  <Link href="/projects">Explore Projects</Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-4 pt-8 text-white/60 text-sm">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] uppercase font-bold text-white">
                            {i < 4 ? <Users className="w-3 h-3" /> : "+2k"}
                        </div>
                    ))}
                 </div>
                 <p>Join 2,000+ partners worldwide</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 animate-slide-in-up-delay-1 relative">
                {/* Decorative blob */}
                <div className="absolute -inset-10 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 blur-3xl rounded-full opacity-50 -z-10 animate-pulse" />
                
              {
                isLoading ? <Card className="glass-card text-white col-span-2"><CardHeader><CardTitle>Loading Ecosystem...</CardTitle></CardHeader></Card> :
                [
                  { value: partnerCount.toLocaleString(), label: "Active Partners", icon: Users, color: "text-blue-400", delay: "delay-100" },
                  { value: `₦${totalContributions.toLocaleString()}`, label: "Total Contributions", icon: TrendingUp, color: "text-purple-400", delay: "delay-200" },
                  { value: fundedProjectsCount.toLocaleString(), label: "Projects Funded", icon: Zap, color: "text-yellow-400", delay: "delay-300" },
                  { value: "100%", label: "Transparency", icon: Shield, color: "text-green-400", delay: "delay-400" },
                ].map((stat, index) => (
                  <Card
                    key={index}
                    className={`glass-card border-white/10 hover:bg-white/5 transition-all duration-300 hover:-translate-y-2 group ${index === 1 || index === 3 ? "lg:mt-12" : ""}`}>
                    <CardHeader className="space-y-1">
                      <div className={`p-3 rounded-xl bg-white/5 w-fit ${stat.color} mb-2 group-hover:scale-110 transition-transform`}>
                         <stat.icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-3xl font-bold text-white tracking-tight">{stat.value}</CardTitle>
                      <CardDescription className="text-white/60 font-medium">{stat.label}</CardDescription>
                    </CardHeader>
                  </Card>
                ))
              }
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-20">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 mb-4">Why Join Us?</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">
              Empowering your <span className="text-primary">impact journey</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              We provide the tools, transparency, and community you need to make a lasting difference.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Real-time Tracking",
                description:
                  "Track every contribution with precision. See exactly where your funds go and validte the impact instantly.",
              },
              {
                icon: Target,
                title: "Impact Analytics",
                description:
                  "Visualize your social return on investment with comprehensive dashboards and downloadable reports.",
              },
              {
                icon: Award,
                title: "Recognition System",
                description:
                  "Earn verified badges and certificates as you reach milestones, showcasing your commitment to social good.",
              },
               {
                icon: Shield,
                title: "Verified Trust",
                description:
                  "All projects are vetted and monitored. We ensure 100% transparency in fund utilization.",
              },
               {
                icon: Users,
                title: "Global Community",
                description:
                  "Connect with like-minded changemakers, share stories, and collaborate on larger initiatives.",
              },
               {
                icon: Zap,
                title: "Quick Action",
                description:
                  "Seamless payment integrations allow you to support urgent causes in seconds, not days.",
              },
            ].map((feature, index) => (
              <Card key={index} className="bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group h-full">
                <CardHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardContent className="p-0 text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardContent>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 px-4 bg-background relative overflow-hidden">
         <div className="container mx-auto max-w-6xl relative z-10">
             <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 relative">
                    {/* Mock UI/Image Area */}
                   <div className="aspect-square rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-border shadow-2xl relative overflow-hidden flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-800/50" />
                        <div className="relative space-y-4 w-full max-w-sm">
                             {/* Mock Process Steps Card */}
                             <div className="bg-card rounded-xl p-4 shadow-lg border border-border animate-slide-in-up-delay-1 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">1</div>
                                <div>
                                    <h4 className="font-bold text-sm">Create Account</h4>
                                    <p className="text-xs text-muted-foreground">Join in 30 seconds</p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                             </div>
                              <div className="bg-card rounded-xl p-4 shadow-lg border border-border animate-slide-in-up-delay-2 flex items-center gap-4 ml-8">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">2</div>
                                <div>
                                    <h4 className="font-bold text-sm">Choose Project</h4>
                                    <p className="text-xs text-muted-foreground">Select a cause</p>
                                </div>
                                 <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                             </div>
                              <div className="bg-card rounded-xl p-4 shadow-lg border border-border animate-slide-in-up-delay-3 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">3</div>
                                <div>
                                    <h4 className="font-bold text-sm">Track Impact</h4>
                                    <p className="text-xs text-muted-foreground">See results instantly</p>
                                </div>
                                 <Zap className="w-5 h-5 text-purple-500 ml-auto" />
                             </div>
                        </div>
                   </div>
                </div>
                <div className="order-1 lg:order-2 space-y-8">
                     <div className="space-y-4">
                         <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">How It Works</Badge>
                        <h2 className="text-4xl font-bold leading-tight">Simple steps to <br/> <span className="text-primary">start your impact</span></h2>
                        <p className="text-lg text-muted-foreground">
                            We've silenced the noise. Our platform is designed to get you from intention to action in minutes.
                        </p>
                     </div>
                     <div className="space-y-6">
                        {[
                            { title: "Sign Up & Verify", desc: "Create your partner profile and get verified instantly.", icon: Users },
                            { title: "Browse & Fund", desc: "Explore curated projects and fund the ones that resonate with you.", icon: Heart },
                            { title: "Monitor Progress", desc: "Receive real-time updates and impact reports directly to your dashboard.", icon: TrendingUp },
                        ].map((step, i) => (
                             <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-border flex items-center justify-center bg-muted/50">
                                    <step.icon className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed max-w-md">{step.desc}</p>
                                </div>
                             </div>
                        ))}
                     </div>
                     <Button size="lg" className="mt-4">
                         View Projects <ArrowRight className="ml-2 w-4 h-4" />
                     </Button>
                </div>
             </div>
         </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
                 <h2 className="text-4xl font-bold mb-4">Trusted by Visionaries</h2>
                 <p className="text-xl text-muted-foreground">Hear from partners who are changing the world with ZeroUp.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { quote: "ZeroUp gives me the transparency I've always wanted. Seeing exactly where my funds go is a game changer.", author: "Sarah J.", role: "Global Partner" },
                    { quote: "The analytics dashboard helps our organization justify our CSR spend with concrete data. Incredible tool.", author: "Michael T.", role: "Corporate Sponsor" },
                    { quote: "I love the community aspect. Connecting with other changemakers keeps me motivated to do more.", author: "Elena R.", role: "Individual Contributor" },
                ].map((t, i) => (
                    <Card key={i} className="bg-background border-none shadow-lg relative">
                        <CardContent className="pt-8">
                            <MessageSquare className="w-8 h-8 text-primary/20 absolute top-6 left-6" />
                            <p className="text-lg text-muted-foreground mb-6 relative z-10 italic">"{t.quote}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                                <div>
                                    <p className="font-bold text-sm">{t.author}</p>
                                    <p className="text-xs text-muted-foreground">{t.role}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 origin-top-left scale-110"></div>
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="space-y-8 glass-card p-12 rounded-3xl border-primary/10 shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-xl">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">Ready to make a difference?</h2>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Join thousands of partners already making an impact through the ZeroUp Initiative. Start your journey today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 py-6 h-auto shadow-xl shadow-primary/25 hover:scale-105 transition-transform">
                <Link href="/signup">
                  Start Your Partnership
                  <Heart className="w-5 h-5 ml-2 fill-current" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 h-auto bg-transparent border-primary/20 hover:bg-primary/5">
                <Link href="/login">Existing Partner Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/images/zeroup-initiative-logo.png"
                    alt="ZeroUp Initiative"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-xl">ZeroUp Initiative</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Empowering partners to create meaningful change through the Partners Hub. Built with trust, transparency, and technology.
              </p>
              <div className="flex gap-4">
                 {/* Social Icons Mockup */}
                 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"><Globe className="w-4 h-4"/></div>
                 <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"><Users className="w-4 h-4"/></div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Platform</h4>
              <div className="space-y-3 text-sm">
                <Link href="/dashboard" className="block text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/contributions" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contributions
                </Link>
                <Link href="/projects" className="block text-muted-foreground hover:text-primary transition-colors">
                  Projects
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Community</h4>
              <div className="space-y-3 text-sm">
                <Link href="/partners" className="block text-muted-foreground hover:text-primary transition-colors">
                  Partners
                </Link>
                <Link href="/leaderboard" className="block text-muted-foreground hover:text-primary transition-colors">
                  Leaderboard
                </Link>
                <Link href="/stories" className="block text-muted-foreground hover:text-primary transition-colors">
                  Success Stories
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Support</h4>
              <div className="space-y-3 text-sm">
                <Link href="/help" className="block text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
                <Link href="/privacy" className="block text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-16 pt-8 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; 2026 ZeroUp Initiative. All rights reserved.</p>
            <div className="flex gap-8">
                <Link href="#" className="hover:text-foreground">Terms</Link>
                <Link href="#" className="hover:text-foreground">Privacy</Link>
                <Link href="#" className="hover:text-foreground">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
