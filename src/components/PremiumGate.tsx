import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface PremiumGateProps {
  moduleName: string;
  moduleKey: string;
  benefits: string[];
  contactEmail?: string;
  contactSubject?: string;
  children: React.ReactNode;
}

export default function PremiumGate({
  moduleName,
  moduleKey,
  benefits,
  contactEmail = "esg@luxenergia.com.br",
  contactSubject,
  children,
}: PremiumGateProps) {
  const navigate = useNavigate();
  const { user, isModuleBlocked } = useApp();
  const { t } = useLanguage();

  const blocked = isModuleBlocked(moduleKey);

  if (!blocked) return <>{children}</>;

  const subject = contactSubject || `${t('premium.requestCta')} — ${moduleName} | Patria 360JK`;
  const body = `${t('premium.contact')}\n\n${user.full_name}`;
  const mailtoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="relative min-h-[60vh]">
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-background/10 to-background/30" />
      <div className="fixed inset-0 z-20 flex items-center justify-center p-4 pointer-events-none">
        <div className="max-w-md w-full bg-card border border-amber-200 dark:border-amber-700 shadow-2xl rounded-2xl p-8 pointer-events-auto">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-xs font-semibold tracking-widest text-amber-600 dark:text-amber-400 uppercase text-center">
            {t('premium.title')}
          </p>
          <h2 className="text-xl font-bold text-foreground text-center mt-1 mb-4">
            {moduleName}
          </h2>
          <div className="space-y-2 mb-5">
            <p className="text-sm font-medium text-foreground">{t('premium.includes')}</p>
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{b}</span>
              </div>
            ))}
          </div>
          <div className="bg-muted/50 rounded-xl p-4 mb-5">
            <p className="text-sm text-muted-foreground mb-2">
              {t('premium.contact')}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a href={`mailto:${contactEmail}`} className="text-interactive font-medium hover:underline">
                {contactEmail}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <a href="https://luxenergia.com.br" target="_blank" rel="noopener noreferrer" className="text-interactive font-medium hover:underline">
                luxenergia.com.br
              </a>
            </div>
          </div>
          <div className="space-y-2">
            <Button asChild className="w-full h-11 rounded-xl bg-[#0B2A3D] hover:bg-[#0B2A3D]/90 text-white">
              <a href={mailtoHref}>
                <Mail className="w-4 h-4 mr-2" />
                {t('premium.requestCta')}
              </a>
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => navigate(-1)}>
              {t('premium.back')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
