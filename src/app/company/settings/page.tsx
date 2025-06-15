
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/shared/Container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paintbrush, Image as ImageIcon, Save, Link as LinkIcon, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompanySettingsPage() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real application, these values would be saved to a backend.
    // For now, we'll just show a toast.
    toast({
      title: "Settings Updated (Simulated)",
      description: "Company branding and settings would be saved here.",
      action: <Save className="text-primary" />
    });
  };

  return (
    <Container>
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground flex items-center">
          <Settings2 className="mr-3 h-8 w-8 text-primary" />
          Company Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your company's appearance and manage integration settings.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Paintbrush className="mr-3 h-6 w-6 text-primary" />
                Appearance & Branding
              </CardTitle>
              <CardDescription>
                Customize colors and logo to match your company's brand. These settings will apply to your dedicated job board and internal views.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Company Logo URL</Label>
                <div className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <Input id="logoUrl" type="url" placeholder="https://yourcompany.com/logo.png" />
                </div>
                <p className="text-xs text-muted-foreground">Enter the URL of your company logo (e.g., a PNG or SVG).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-sm border bg-[--mock-primary]" />
                        <Input id="primaryColor" type="text" placeholder="#50C878" defaultValue="#50C878" />
                    </div>
                    <p className="text-xs text-muted-foreground">Hex code for your main brand color.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                     <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-sm border bg-[--mock-accent]" />
                        <Input id="accentColor" type="text" placeholder="#3498DB" defaultValue="#3498DB"/>
                    </div>
                    <p className="text-xs text-muted-foreground">Hex code for your secondary/accent color.</p>
                </div>
              </div>
               <p className="text-sm text-muted-foreground pt-4 border-t">
                <strong>Note:</strong> Dynamic theme application based on these inputs is a visual placeholder.
                In a full implementation, these values would be used to update CSS variables (e.g., in <code>globals.css</code>) or via a theming context to reflect your branding across the platform.
              </p>
            </CardContent>
             {/* Mock color display for demo purposes */}
            <style jsx>{`
              :root {
                --mock-primary: ${typeof document !== 'undefined' && (document.getElementById('primaryColor') as HTMLInputElement)?.value || '#50C878'};
                --mock-accent: ${typeof document !== 'undefined' && (document.getElementById('accentColor') as HTMLInputElement)?.value || '#3498DB'};
              }
            `}</style>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <LinkIcon className="mr-3 h-6 w-6 text-primary" />
                Integrations & Advanced Settings
              </CardTitle>
              <CardDescription>
                Manage HRIS integrations, API keys, and other advanced configurations (Conceptual).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="hris">HRIS Integration (Coming Soon)</Label>
                <Button variant="outline" disabled className="w-full">Connect to your HRIS</Button>
                <p className="text-xs text-muted-foreground">Streamline candidate data flow with your existing Human Resource Information System.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Access (Coming Soon)</Label>
                 <Input id="apiKey" type="text" placeholder="No API key generated" readOnly disabled />
                <Button variant="outline" disabled size="sm">Generate API Key</Button>
                <p className="text-xs text-muted-foreground">For custom integrations and programmatic access to AI Talent Stream.</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg">
            <Save className="mr-2 h-5 w-5" />
            Save Company Settings
          </Button>
        </div>
      </form>
    </Container>
  );
}
