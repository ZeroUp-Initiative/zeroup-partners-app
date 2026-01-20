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
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let paymentsLoaded = false;
    let usersLoaded = false;
    let projectsLoaded = false;

    // Listener for total contributions
    const paymentsQuery = query(collection(db, "payments"), where("status", "==", "approved"));
    const unsubscribePayments = onSnapshot(paymentsQuery, (querySnapshot) => {
      let total = 0;
      querySnapshot.forEach((doc) => {
        total += doc.data().amount;
      });
      setTotalContributions(total);
      paymentsLoaded = true;
      checkAllLoaded();
    });

    // Listener for total partners (users)
    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      setPartnerCount(querySnapshot.size);
      usersLoaded = true;
      checkAllLoaded();
    });

    // Listener for fully funded projects
    const projectsQuery = query(collection(db, "projects"), where("status", "==", "fully-funded"));
    const unsubscribeProjects = onSnapshot(projectsQuery, (querySnapshot) => {
      setFundedProjectsCount(querySnapshot.size);
      projectsLoaded = true;
      checkAllLoaded();
    });

    const checkAllLoaded = () => {
      if (paymentsLoaded && usersLoaded && projectsLoaded) {
        setIsLoading(false);
        setDataLoaded(true);
      }
    };

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
                   <Image
                     src="/zeroup-partners-logo-light-mode.png"
                     alt="ZeroUp Partners Logo"
                     fill
                     className="object-contain dark:hidden"
                   />
                   <Image
                     src="/zeroup-partners-logo-dark-mode.png"
                     alt="ZeroUp Partners Logo"
                     fill
                     className="object-contain hidden dark:block"
                   />
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
                    <Link href="/signup">Become a ZeroUp Partner</Link>
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
                  ZeroUp Partners System
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-balance leading-tight text-white tracking-tight">
                  Co‑Create the <br/>
                  <span className="gradient-text drop-shadow-sm">Future of Social Impact</span>
                </h1>
                <p className="text-lg sm:text-xl text-white/80 text-pretty leading-relaxed max-w-lg">
                  Become a ZeroUp Partner. Co create sustainable social impact with communities around the world. Not charity. Partnership.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild className="text-lg px-8 py-6 h-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/10 btn-modern">
                  <Link href="/signup">
                    Become a ZeroUp Partner
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="text-lg px-8 py-6 h-auto glass-card text-white border-white/20 hover:bg-white/10 hover:border-white/40 transition-all"
                >
                  <Link href="#how-it-works">Learn How It Works</Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-4 pt-8 text-white/60 text-sm">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] uppercase font-bold text-white">
                            {i < 4 ? <Users className="w-3 h-3" /> : `+${partnerCount}`}
                        </div>
                    ))}
                 </div>
                 <p>Join {partnerCount > 0 ? partnerCount.toLocaleString() : '10'}+ partners worldwide</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-slide-in-up-delay-1 relative">
                {/* Decorative blob */}
                <div className="absolute -inset-10 bg-gradient-to-tr from-purple-500/30 to-blue-500/30 blur-3xl rounded-full opacity-50 -z-10 animate-pulse" />
                
              {
                isLoading ? 
                [
                  { value: "0", label: "Active Partners", icon: Users, color: "text-blue-400", delay: "delay-100" },
                  { value: "₦0", label: "Total Contributions", icon: TrendingUp, color: "text-purple-400", delay: "delay-200" },
                  { value: "0", label: "Projects Funded", icon: Zap, color: "text-yellow-400", delay: "delay-300" },
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
                )) :
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

      {/* What Is a ZeroUp Partner Section */}
      <section id="who-is-zeroup-partner" className="py-24 px-4 bg-background" aria-labelledby="zeroup-partner-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">Understanding the Role</Badge>
            <h2 id="zeroup-partner-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-balance tracking-tight">
              Who Is a <span className="text-primary">ZeroUp Partner</span>?
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              A ZeroUp Partner is not a donor. A ZeroUp Partner is a co‑creator—someone who actively participates in designing, supporting, and scaling social impact solutions alongside communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Collaborator, Not Benefactor</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      ZeroUp Partners are collaborators, builders, and co‑owners of solutions shaping the future of development.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Active Participation</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Contribute ideas, skills, resources, capital, and networks to build long‑term impact alongside communities.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Shared Ownership</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Every partner contributes differently, but all partners co‑own the mission and impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-2xl relative overflow-hidden flex items-center justify-center p-8">
                <div className="absolute inset-0 bg-grid-primary/20 [mask-image:linear-gradient(0deg,transparent,white)]" />
                <div className="relative text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                    <Globe className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-primary mb-2">Partnership at ZeroUp</h4>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Starting from possibility, not lack. Building from context, not assumptions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-20">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 mb-4">Why ZeroUp Partners?</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">
              Beyond <span className="text-primary">Traditional Development</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Traditional development models focus on giving. The ZeroUp Partners System focuses on building—together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Co-Creation",
                description:
                  "Design solutions alongside communities, not for them. Your insights and experience shape the impact.",
              },
              {
                icon: Target,
                title: "Skills & Expertise",
                description:
                  "Contribute your professional skills, knowledge, and mentorship to build sustainable solutions.",
              },
              {
                icon: TrendingUp,
                title: "Funding & Resources",
                description:
                  "Provide financial support and resources that enable communities to implement their vision.",
              },
               {
                icon: Shield,
                title: "Network & Opportunities",
                description:
                  "Open doors to new partnerships, markets, and opportunities that amplify local impact.",
              },
               {
                icon: Zap,
                title: "Technology & Infrastructure",
                description:
                  "Share technology tools, platforms, and infrastructure that enable scalable solutions.",
              },
               {
                icon: Award,
                title: "Research & Storytelling",
                description:
                  "Help document impact, share stories, and contribute to learning that benefits the entire ecosystem.",
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
      <section id="how-it-works" className="py-24 px-4 bg-background relative overflow-hidden">
         <div className="container mx-auto max-w-6xl relative z-10">
             <div className="text-center space-y-4 mb-20">
                 <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">How It Works</Badge>
                 <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">
                   The <span className="text-primary">ZeroUp Partners System</span> Flow
                 </h2>
                 <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                   From discovery to impact, here's how you become a ZeroUp Partner and start co-creating meaningful change.
                 </p>
             </div>

             <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1 relative">
                    {/* 6-Step Process Visual */}
                   <div className="aspect-square rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-border shadow-2xl relative overflow-hidden flex items-center justify-center p-8">
                        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-800/50" />
                        <div className="relative space-y-3 w-full max-w-sm">
                             {[
                                 { step: 1, title: "Discover ZeroUp", desc: "Learn about active impact areas", icon: Globe, color: "bg-blue-100 text-blue-600" },
                                 { step: 2, title: "Apply to Partner", desc: "Submit your partnership application", icon: Users, color: "bg-green-100 text-green-600" },
                                 { step: 3, title: "Get Matched", desc: "Connect with relevant projects", icon: Target, color: "bg-purple-100 text-purple-600" },
                                 { step: 4, title: "Onboard", desc: "Join the ecosystem orientation", icon: Shield, color: "bg-orange-100 text-orange-600" },
                                 { step: 5, title: "Co-Create", desc: "Collaborate and contribute", icon: Heart, color: "bg-pink-100 text-pink-600" },
                                 { step: 6, title: "Track Impact", desc: "Monitor outcomes and learning", icon: TrendingUp, color: "bg-cyan-100 text-cyan-600" },
                             ].map((item, index) => (
                                <div key={index} className={`bg-card rounded-xl p-3 shadow-lg border border-border animate-slide-in-up-delay-${index + 1} flex items-center gap-3 ${index > 0 ? 'ml-' + (index * 2) : ''}`}>
                                    <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                                        {item.step}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                                        <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                                    </div>
                                    <item.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                </div>
                             ))}
                        </div>
                   </div>
                </div>
                <div className="order-1 lg:order-2 space-y-8">
                     <div className="space-y-4">
                        <h3 className="text-2xl font-bold leading-tight">
                          From <span className="text-primary">Intention to Impact</span>
                        </h3>
                        <p className="text-lg text-muted-foreground">
                            The ZeroUp Partners System is designed to transform your desire to make a difference into meaningful, collaborative action.
                        </p>
                     </div>
                     <div className="space-y-6">
                        {[
                            { 
                                title: "Discovery & Alignment", 
                                desc: "Explore our ecosystem and find where your passion meets community needs. We help you identify the perfect match.",
                                icon: Globe 
                            },
                            { 
                                title: "Application & Profiling", 
                                desc: "Share your skills, interests, and capacity. Our system understands not just what you give, but how you want to engage.",
                                icon: Users 
                            },
                            { 
                                title: "Matching & Onboarding", 
                                desc: "Get connected to projects and communities where you'll create the most impact. We ensure smooth integration into the ecosystem.",
                                icon: Target 
                            },
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
                     <Button size="lg" asChild className="mt-4">
                         <Link href="/signup">Apply to Become a Zero Partner</Link>
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

      {/* Who Can Become a ZeroUp Partner Section */}
      <section id="who-can-join" className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">Join the Movement</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">
              Who Can Become a <span className="text-primary">ZeroUp Partner</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              If you care about impact and collaboration, there is a place for you in the ZeroUp Partners System.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Individuals",
                description: "Professionals, creatives, technologists, students, and diaspora contributors who want to make a difference.",
                examples: [
                  "Software developers",
                  "Designers & artists", 
                  "Researchers & academics",
                  "Students & youth leaders"
                ],
                color: "text-blue-600"
              },
              {
                icon: Shield,
                title: "Organisations",
                description: "NGOs, companies, foundations, and institutions looking to scale their impact through collaboration.",
                examples: [
                  "NGOs & foundations",
                  "Startups & companies",
                  "Educational institutions",
                  "Development agencies"
                ],
                color: "text-green-600"
              },
              {
                icon: Target,
                title: "Strategic Partners",
                description: "Long-term ecosystem collaborators who help shape strategy, systems, and future directions.",
                examples: [
                  "Ecosystem builders",
                  "Policy influencers",
                  "Innovation labs",
                  "Network organizations"
                ],
                color: "text-purple-600"
              }
            ].map((category, index) => (
              <Card key={index} className="bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group h-full">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <category.icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl mb-3">{category.title}</CardTitle>
                  <CardContent className="p-0">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {category.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Examples:</p>
                      <ul className="space-y-1">
                        {category.examples.map((example, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <Heart className="w-6 h-6 text-primary" />
              <p className="text-lg font-medium">
                Every contribution matters. Every voice counts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Areas Section */}
      <section id="impact-areas" className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">Focus Areas</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">
              <span className="text-primary">Impact Areas</span> Where We Co-Create
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              Find your area of passion and contribute to meaningful change across these key domains.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Youth Empowerment", icon: Users, desc: "Building the next generation of leaders" },
              { name: "Education & Digital Literacy", icon: Target, desc: "Access to quality learning for all" },
              { name: "Technology & AI for Good", icon: Zap, desc: "Innovative solutions for social challenges" },
              { name: "Creative Economy", icon: Award, desc: "Supporting artists and creative entrepreneurs" },
              { name: "Community Innovation", icon: Shield, desc: "Local solutions to global challenges" },
              { name: "Entrepreneurship & Inclusion", icon: TrendingUp, desc: "Economic opportunities for marginalized groups" }
            ].map((area, index) => (
              <Card key={index} className="bg-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                <CardHeader className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <area.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-lg mb-2">{area.name}</CardTitle>
                  <CardContent className="p-0">
                    <p className="text-sm text-muted-foreground">{area.desc}</p>
                  </CardContent>
                </CardHeader>
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
              <h2 className="text-4xl md:text-5xl font-bold text-balance tracking-tight">Ready to co-create the future?</h2>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Join a global ecosystem of builders shaping the future of social impact. Become a Zero Partner today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button size="lg" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto shadow-xl shadow-primary/25 hover:scale-105 transition-transform">
                <Link href="/signup">
                  Apply to Become a Zero Partner
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 ml-2 fill-current" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 h-auto bg-transparent border-primary/20 hover:bg-primary/5">
                <Link href="/login">Existing Zero Partner Login</Link>
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
