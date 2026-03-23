import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Linkedin,
  BookOpen,
  Users,
  GraduationCap,
  Globe
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Our Team', path: '/team' },
    { name: 'Academics', path: '/academics' },
    { name: 'Contact Us', path: '/contact' }
  ];

  const subjects = [
    'Mathematics',
    'Science',
    'NCERT Curriculum',
    'ICSE Curriculum',
    'IGCSE Curriculum'
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4 pt-0 md:pt-6">
            <div className="flex items-center space-x-2 mb-6">
              <h3 className="text-2xl font-bold">
                <span className="text-white">Learn</span><span className="text-red-500">ED</span>
              </h3>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Empowering every student to confidently think, analyze, and learn through our innovative blend of traditional and modern teaching methods.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/learned.edtech" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-700 p-2 rounded-full hover:bg-blue-600 transition-colors duration-300"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://www.instagram.com/learned.classes/?igshid=MzRlODBiNWFlZA%3D%3D" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-700 p-2 rounded-full hover:bg-pink-600 transition-colors duration-300"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://www.linkedin.com/company/crack-tech/?viewAsMember=true" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-700 p-2 rounded-full hover:bg-blue-700 transition-colors duration-300"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 pt-0 md:pt-6">
            <h4 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-red-500" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path}
                    className="text-gray-300 hover:text-red-400 transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-red-500 rounded-full group-hover:w-2 transition-all duration-300"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subjects & Curriculum */}
          <div className="space-y-4 pt-0 md:pt-6">
            <h4 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <GraduationCap className="w-5 h-5 text-red-500" />
              What We Teach
            </h4>
            <ul className="space-y-3">
              {subjects.map((subject, index) => (
                <li key={index} className="text-gray-300 flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  {subject}
                </li>
              ))}
            </ul>
            <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 p-3 rounded-lg border border-red-800/50 mt-4">
              <p className="text-red-200 text-sm font-medium">Classes 2 - 12</p>
              <p className="text-red-300 text-xs">Comprehensive curriculum coverage</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 pt-0 md:pt-6">
            <h4 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Phone className="w-5 h-5 text-red-500" />
              Get In Touch
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    M-2/111, Phase-2, Kabir Nagar<br />
                    Raipur, Chhattisgarh, India<br />
                    Pincode: 492099
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <a href="tel:+919019120669" className="text-gray-300 hover:text-red-400 transition-colors">
                    +91-9019120669
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                <a 
                  href="mailto:support@learnedtech.in" 
                  className="text-gray-300 hover:text-red-400 transition-colors text-sm"
                >
                  support@learnedtech.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Download */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold flex items-center justify-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-red-500" />
              Download Our Mobile App
            </h4>
            <p className="text-gray-300 mb-6">
              Take your learning journey on the go with our mobile app. Access classes, track progress, and stay connected with our learning community.
            </p>
          </div>
          <div className="flex justify-center">
            <a 
              href="https://play.google.com/store/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.92 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-red-100">Get it on</div>
                <div className="text-sm font-bold">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} LearnED. All rights reserved. Transforming education, one student at a time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-red-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-red-400 transition-colors">Terms of Service</Link>
              <Link to="/refund-policy" className="text-gray-400 hover:text-red-400 transition-colors">Refund Policy</Link>
              <Link to="/delete-account" className="text-gray-400 hover:text-red-400 transition-colors">Delete Account</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
