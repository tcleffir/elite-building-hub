import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockUsers, roleLabels } from "@/lib/mock-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { localeLabels, Locale } from "@/lib/translations";
import logoAzul from "@/assets/logo-azul.png";
import logoBranco from "@/assets/logo-branco.png";
import heroBuilding from "@/assets/hero-building.jpg";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccess, setShowDemoAccess] = useState(false);
  const navigate = useNavigate();
  const { t, locale, setLocale } = useLanguage();
  const { switchUser } = useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const matchedUser = mockUsers.find(u => u.email === email);
    const redirectPath = matchedUser?.role === 'gestor_fundo' ? '/proprietario/portfolio' : '/dashboard';
    setTimeout(() => {
      if (matchedUser) switchUser(matchedUser.id);
      setIsLoading(false);
      navigate(redirectPath);
    }, 800);
  };

  const fillDemoCredentials = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
  };

  const heroTexts = {
    pt: { title: "Gestão de Portfólio", desc: "A plataforma premium de gestão de portfólio para fundos imobiliários: ativos, contratos, locatários e resultados em um único ecossistema." },
    es: { title: "Gestión de Portafolio", desc: "La plataforma premium de gestión de portafolio para fondos inmobiliarios: ativos, contratos, inquilinos y resultados en un único ecosistema." },
    en: { title: "Portfolio Management", desc: "The premium portfolio management platform for real estate funds: assets, leases, tenants and results in a single ecosystem." },
  };

  const firstAccessTexts = {
    pt: { q: "Primeiro acesso?", a: "Use seu código de convite" },
    es: { q: "¿Primer acceso?", a: "Use su código de invitación" },
    en: { q: "First time?", a: "Use your invite code" },
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={heroBuilding}
          alt="Portfólio de ativos logísticos"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 premium-gradient opacity-60" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <img src={logoBranco} alt="Vinci Compass" className="w-72 mb-6" />
          <h2 className="text-3xl font-bold text-card mb-2">
            {heroTexts[locale].title}
          </h2>
          <p className="text-lg text-card/80 max-w-md">
            {heroTexts[locale].desc}
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-primary-foreground relative">
        {/* Language switcher */}
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Globe size={16} />
                <span className="text-xs font-medium">{localeLabels[locale].flag} {localeLabels[locale].short}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {(Object.keys(localeLabels) as Locale[]).map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={`cursor-pointer gap-2 ${locale === loc ? "bg-muted font-medium" : ""}`}
                >
                  <span>{localeLabels[loc].flag}</span>
                  <span>{localeLabels[loc].label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-10 flex justify-center">
            <img src={logoAzul} alt="Vinci Compass" className="w-64" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('dashboard.welcome')}</h1>
            <p className="text-muted-foreground">
              {locale === 'pt' && 'Acesse sua conta para gerenciar seu portfólio de ativos'}
              {locale === 'es' && 'Acceda a su cuenta para gestionar su portafolio de activos'}
              {locale === 'en' && 'Sign in to manage your asset portfolio'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('login.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('login.password')}
                </Label>
                <button
                  type="button"
                  className="text-sm text-interactive hover:text-secondary transition-colors"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-lg pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-lg text-base font-semibold premium-gradient hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2" size={18} />
                  {t('login.submit')}
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {firstAccessTexts[locale].q}{" "}
            <button className="text-interactive hover:text-secondary font-medium transition-colors">
              {firstAccessTexts[locale].a}
            </button>
          </p>

          {/* Demo Access Section */}
          <div className="mt-6 border-t pt-4">
            <button
              onClick={() => setShowDemoAccess(!showDemoAccess)}
              className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>🔧 {t('login.demoAccounts')}</span>
              {showDemoAccess ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDemoAccess && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {mockUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => fillDemoCredentials(u.email, u.password || '')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-interactive/50 hover:bg-muted/50 transition-all text-left group"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: u.avatar_bg || '#0B2A3D' }}
                    >
                      {u.avatar_initials || u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-interactive transition-colors">
                        {u.full_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {u.company} • {t(`role.${u.role}` as any)}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {u.email.split('@')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
