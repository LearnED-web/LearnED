import React, { useState, memo } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await fetch('https://script.google.com/macros/s/AKfycbxrs3LPaLa_u5nr2E-WzK0Gcwl8thjBSyRi9R22ffn3KyDEB7FlQVUkapKjFlIlc33Fuw/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          message: formData.message
        })
      });
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: [
        <a href="tel:+919019120669" className="hover:text-red-600 transition-colors">+91-9019120669</a>
      ],
      description: "Call us for immediate assistance"
    },
    {
      icon: Mail,
      title: "Email",
      details: ["support@learnedtech.in"],
      description: "Send us your queries anytime"
    },
    {
      icon: MapPin,
      title: "Address",
      details: ["M-2/111, Phase-2, Kabir Nagar", "Raipur, Chhattisgarh, India", "Pincode: 492099"],
      description: "Visit our main campus"
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: ["Monday - Friday: 9:00 AM - 8:00 PM", "Saturday: 10:00 AM - 6:00 PM", "Sunday: 2:00 PM - 6:00 PM"],
      description: "We're here to help during these hours"
    }
  ];

  const faqs = [
    {
      question: "What is LearnED?",
      answer: "LearnED is an innovative online teaching platform dedicated to helping students achieve their full potential. We focus on providing personalized attention to small groups of students, ensuring they excel academically."
    },
    {
      question: "How many classes will my child have in a month?",
      answer: "Your child will receive 12 hours of instruction per month, typically distributed as 3 hours per week. This structure allows for consistent learning and ample time for practice and reinforcement."
    },
    {
      question: "How long is each session?",
      answer: "Each session lasts 90 minutes, with your child attending two sessions per week. This format is designed to maximize engagement and retention without overwhelming the student."
    },
    {
      question: "What subjects can my child study at LearnED?",
      answer: "We offer comprehensive tutoring for students from Grade 2 to Grade 10, covering subjects like Mathematics, Science, and English. We specialize in CBSE, ICSE, and IGCSE curricula."
    },
    {
      question: "What are the qualifications of the tutors at LearnED?",
      answer: "Our tutors are highly qualified and carefully selected to match your child's specific needs. We ensure that each tutor has the expertise and teaching experience required to guide your child effectively."
    },
    {
      question: "How is the class schedule determined?",
      answer: "Class schedules are tailored to fit your child's availability. We work closely with parents to find a time that best suits the student's routine, ensuring a consistent learning experience."
    },
    {
      question: "What is the fee structure?",
      answer: "The fee is determined based on your child's specific educational needs and the board of education they are enrolled in. Our pricing is competitive and reflective of the personalized service we offer."
    },
    {
      question: "How do you assess my child's progress?",
      answer: "We conduct regular assessments to monitor your child's progress. Feedback is provided after each session, and detailed progress reports are shared periodically with parents to ensure transparency and track improvements."
    },
    {
      question: "What technology is required for online classes?",
      answer: "Your child will need a stable internet connection, a computer or tablet, and a webcam for interactive sessions. We also recommend using a headset with a microphone for clear communication."
    },
    {
      question: "How do I enroll my child in LearnED?",
      answer: "Enrollment is simple. Contact us via our WhatsApp or over a phone call, and we'll guide you through the process, including an initial consultation to understand your child's needs and set up their learning plan."
    }
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-red-600 via-red-700 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Get in <span className="text-red-200">Touch</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Ready to start your educational journey? We're here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section id="send-message" className="section-padding bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Send us a <span className="text-gradient">Message</span>
              </h2>
              <p className="text-gray-600 mb-8">
                Have questions about our programs? Want to schedule a consultation? 
                Fill out the form below and we'll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your email address (optional)"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Tell us how we can help you... (optional)"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary w-full flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>

                {/* Success/Error Messages */}
                {submitStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                    <CheckCircle size={20} />
                    <span>Message sent successfully! We'll get back to you soon.</span>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                    <AlertCircle size={20} />
                    <span>Something went wrong. Please try again.</span>
                  </div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Contact <span className="text-gradient">Information</span>
              </h2>
              <p className="text-gray-600 mb-8">
                We're here to answer your questions and help you get started on your educational journey.
              </p>

              <div className="space-y-8">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <info.icon className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{info.title}</h3>
                      <div className="text-gray-700 mb-2">
                        {info.details.map((detail, idx) => (
                          <div key={idx}>{detail}</div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our programs and services
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your <span className="text-red-400">Learning Journey?</span>
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
              Don't wait to unlock your potential. Contact us today and take the first step 
              towards academic excellence.
            </p>
            <button 
              onClick={() => {
                document.getElementById('send-message')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition-colors"
            >
              Book a Free Demo Class
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(Contact);
