import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Login Form */}
        <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-8 sm:p-12 lg:p-20 bg-white dark:bg-gray-900 z-10">
          <div className="w-full max-w-md mx-auto">
            <Link to="/" className="flex justify-center mb-10">
              <img
                width={200}
                height={40}
                src="/images/logo/auth-logo.svg"
                alt="Logo"
                className="brightness-90 dark:brightness-110"
              />
            </Link>
            {children}
          </div>
        </div>
        
        {/* Right Side: Branding/Image */}
        <div className="hidden lg:flex lg:w-1/2 bg-brand-950 dark:bg-white/5 relative items-center justify-center overflow-hidden">
          {/* Background Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-950 to-brand-800 opacity-100"></div>
          
          <div className="absolute inset-0 opacity-20">
            <GridShape />
          </div>
          
          <div className="relative flex flex-col items-center justify-center p-12 text-white z-1 text-center">
            <div className="mb-8 p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-lg">
              <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Smart POS Solution</h2>
              <p className="text-lg text-brand-100/90 leading-relaxed">
                Empower your business with our intuitive and powerful point of sale system. 
                Designed for speed, reliability, and modern commerce.
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-10 px-6 py-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <p className="text-sm font-semibold text-green-500/90 dark:text-brand-100/90">System Online & Secure</p>
            </div>
          </div>
        </div>

        {/* Theme Toggler */}
        <div className="fixed z-50 bottom-6 right-6">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
