import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container px-4 py-8 mx-auto sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center space-x-2">
              <img src="/simbolo-light.svg" alt="Viralizer" className="w-8 h-8 dark:hidden" />
              <img src="/logo-extra-dark.svg" alt="Viralizer" className="w-8 h-8 hidden dark:block" />
              <span className="text-xl font-bold text-foreground">Viralizer</span>
            </Link>
            <p className="text-muted-foreground">Potencialize seu conteúdo com imagens geradas por IA.</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-foreground/80 uppercase">Plataforma</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/recursos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/precos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/estilos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Estilos
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-foreground/80 uppercase">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/tutoriais" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tutoriais
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-foreground/80 uppercase">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Viralizer. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
