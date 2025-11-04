"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "motion/react";
import { ArrowRight, FileText, CreditCard, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="text-center py-24 px-6">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold mb-4 text-foreground"
        >
          Smart Invoice Generator for Modern Businesses
        </motion.h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          Create, customize, and automate your invoices effortlessly. Manage multiple companies,
          templates, and clients with advanced reporting and payment integration.
        </p>
        <Link href="/auth">
          <Button size="lg" className="rounded-full">
            Get Started <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-6">
          <FeatureCard
            icon={<FileText className="w-10 h-10 text-primary" />}
            title="Custom Templates"
            description="Design your invoices using dynamic templates with full branding support, logos, and colors."
          />
          <FeatureCard
            icon={<CreditCard className="w-10 h-10 text-primary" />}
            title="Payment Integration"
            description="Accept payments via Stripe, PayPal, or QRIS directly from your invoice with automatic status updates."
          />
          <FeatureCard
            icon={<BarChart3 className="w-10 h-10 text-primary" />}
            title="Analytics Dashboard"
            description="Get visual insights into revenue, overdue invoices, and client activity using real-time analytics."
          />
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20 bg-muted border-t border-border">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-3 text-foreground">Advanced Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run a professional invoicing system — built with automation and
            scalability in mind.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
          <AdvancedFeature
            title="Multi-Company Support"
            description="Manage multiple companies and entities from a single dashboard with separate financial tracking."
          />
          <AdvancedFeature
            title="Automated Recurring Invoices"
            description="Set up recurring invoices with flexible schedules and automatic delivery to your clients."
          />
          <AdvancedFeature
            title="Tax & Compliance"
            description="Automatic tax calculations and compliance reporting for different jurisdictions."
          />
          <AdvancedFeature
            title="Client Portal"
            description="Provide clients with a secure portal to view, download, and pay invoices."
          />
          <AdvancedFeature
            title="Export & Reports"
            description="Export data in multiple formats and generate detailed financial reports."
          />
          <AdvancedFeature
            title="API Access"
            description="Integrate with your existing tools through our comprehensive REST API."
          />
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function AdvancedFeature({ title, description }: { title: string; description: string }) {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
