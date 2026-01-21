import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, X, Megaphone } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

const Navbar = () => {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/issues', label: 'View Issues' },
    { path: '/map', label: 'Map View' },
    { path: '/about', label: 'About' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-[#FFF5E6]/95 backdrop-blur-md shadow-lg' 
        : 'bg-[#FFF5E6] shadow-sm'
    }`}>
      <div className="civic-container py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 group"
          >
            <div className="relative overflow-hidden rounded-lg">
              <img 
                src="/logo.png" 
                alt="BOL BHARAT Logo" 
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-110" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#1E3A4F] leading-tight">
                BOL BHARAT
              </span>
              <span className="text-[10px] text-[#FF7722] font-medium tracking-wider hidden sm:block">
                SPEAK FOR CHANGE
              </span>
            </div>
          </Link>
          
          {/* Mobile Menu Button */}
          {isMobile ? (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden relative z-50"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                <div className="relative w-6 h-6">
                  <Menu className={`h-6 w-6 text-[#1E3A4F] absolute transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
                  }`} />
                  <X className={`h-6 w-6 text-[#1E3A4F] absolute transition-all duration-300 ${
                    mobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                  }`} />
                </div>
              </Button>
              
              {/* Mobile Menu Overlay */}
              <div className={`fixed inset-0 bg-black/50 transition-opacity duration-300 md:hidden ${
                mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`} onClick={() => setMobileMenuOpen(false)} />
              
              {/* Mobile Menu Panel */}
              <div className={`fixed top-0 right-0 h-full w-72 bg-[#FFF5E6] shadow-2xl p-6 pt-20 flex flex-col space-y-2 md:hidden transition-transform duration-300 ease-out ${
                mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}>
                {navLinks.map((link, index) => (
                  <Link 
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActiveRoute(link.path)
                        ? 'bg-[#FF7722]/10 text-[#FF7722]'
                        : 'text-[#1E3A4F] hover:bg-[#FF7722]/5 hover:text-[#FF7722]'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Button 
                    asChild 
                    className="bg-[#FF7722] hover:bg-[#FF7722]/90 w-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Link to="/report" className="flex items-center justify-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Report Issue
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Desktop Navigation */
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 relative ${
                    isActiveRoute(link.path)
                      ? 'text-[#FF7722]'
                      : 'text-[#1E3A4F] hover:text-[#FF7722]'
                  }`}
                >
                  {link.label}
                  {isActiveRoute(link.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FF7722] rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          )}
          
          {/* Desktop CTA Button */}
          <Button 
            asChild 
            className="bg-[#FF7722] hover:bg-[#FF7722]/90 hidden md:flex shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <Link to="/report" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Report Issue
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
