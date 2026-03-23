import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-16">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-red-50 to-red-100 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Refund Policy
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At LearnED, we are committed to providing exceptional educational services. Please review our refund policy to understand your options.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Refund Eligibility */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                Refund Eligibility
              </h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="text-gray-700">
                <p className='mb-4'>We offer refunds under the following circumstances:</p>
                <ul className='space-y-2 text-gray-700'>
                  <li>• Technical issues preventing access to classes for more than 48 hours</li>
                  <li>• Dissatisfaction with our teaching methodology within the first 7 days</li>
                  <li>• Inability to attend classes due to unforeseen personal circumstances</li>
                  <li>• Course cancellation by LearnED administration</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Refund Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <Clock className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                Refund Timeline
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-blue-900 mb-2">
                  100% Refund
                </h3>
                <p className="text-blue-700">
                  Within 7 days of enrollment
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-yellow-900 mb-2">
                  75% Refund
                </h3>
                <p className="text-yellow-700">
                  Within 8-14 days of enrollment
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-orange-900 mb-2">
                  50% Refund
                </h3>
                <p className="text-orange-700">
                  Within 15-30 days of enrollment
                </p>
              </div>
            </div>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">
                  No refunds are available after 30 days of enrollment, except in cases of technical issues caused by our platform.
                </p>
              </div>
            </div>
          </motion.div>

          {/* How to Request Refund */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              How to Request a Refund
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <ol className='space-y-4 text-gray-700'>
                <li className='flex items-start'>
                  <span className='bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0'>1</span>
                  <div><strong>Contact our support team</strong> at support@learnedtech.in or call us at +91-XXXX-XXXX-XX</div>
                </li>
                <li className='flex items-start'>
                  <span className='bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0'>2</span>
                  <div><strong>Provide your enrollment details</strong> including student name, course, and reason for refund</div>
                </li>
                <li className='flex items-start'>
                  <span className='bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0'>3</span>
                  <div><strong>Submit required documentation</strong> if applicable (medical certificates, etc.)</div>
                </li>
                <li className='flex items-start'>
                  <span className='bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0'>4</span>
                  <div><strong>Await processing</strong> - Refunds are typically processed within 7-10 business days</div>
                </li>
              </ol>
            </div>
          </motion.div>

          {/* Important Notes */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Important Notes
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <ul className='space-y-3 text-gray-700'>
                <li>• Refunds will be processed to the original payment method</li>
                <li>• Bank charges or transaction fees are non-refundable</li>
                <li>• Partial course completion may affect refund eligibility</li>
                <li>• LearnED reserves the right to modify this policy with 30 days notice</li>
                <li>• Disputes will be handled according to Indian consumer protection laws</li>
              </ul>
            </div>
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About Our Refund Policy?
            </h2>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you understand your options and guide you through the refund process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@learnedtech.in"
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Email Support
              </a>
              <a
                href="tel:+91-XXXX-XXXX-XX"
                className="bg-white border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default RefundPolicy;