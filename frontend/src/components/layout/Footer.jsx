import React from 'react';
import { Radio, Code2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import siteConfig from '../../config/siteConfig';

export function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Radio className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-zinc-900">
                {siteConfig.logo.textPrefix}<span className="text-indigo-600">{siteConfig.logo.textHighlight}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li><Link to="/#features" className="hover:text-zinc-900">Features</Link></li>
              <li><Link to="/#how-it-works" className="hover:text-zinc-900">How It Works</Link></li>
              <li><Link to="/demo" className="hover:text-zinc-900">Live Demo</Link></li>
              <li><Link to="/polls/create" className="hover:text-zinc-900">Create Poll</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
              Stack
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li><span className="text-zinc-700 font-medium">Frontend:</span> React + Vite + Tailwind</li>
              <li><span className="text-zinc-700 font-medium">Backend:</span> Go (Gin) + WebSocket</li>
              <li><span className="text-zinc-700 font-medium">Database:</span> MongoDB</li>
              <li><span className="text-zinc-700 font-medium">Real-Time:</span> Redis Pub/Sub</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
              Resources
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-zinc-900 flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li><Link to="/login" className="hover:text-zinc-900">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-zinc-900">Sign Up</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-400 gap-4">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for HCL / GUVI Developer Task
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
