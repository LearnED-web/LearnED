import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const sections = [
  {
    id: 'terms',
    title: 'Terms and Conditions',
    content: `Terms and Conditions

This privacy policy applies to all Users who access the Platform and are therefore required to read and understand the Policy before submitting any Personal Information (defined hereinafter). This privacy policy governs your use of the application of 'LearnED', LearnED YouTube Channel, www.learnedtech.in ('Website') and the other associated applications, products, Website and services managed by the Company. By submitting Personal Information, you are consenting to the use and processing of such information in accordance with this Policy. Third party Website may place their own cookies or other files on the Users' computer, collect data or solicit personal information from the Users, for which LearnED is not responsible or liable. Accordingly, LearnED does not make any representations concerning the privacy practices or policies of such third parties or terms of use of such Website, nor does LearnED guarantee the accuracy, integrity, or quality of the information, data, text, software, sound, photographs, graphics, videos, messages or other materials available on such Website/Applications. The inclusion or exclusion does not imply any endorsement by LearnED of the Website, the Website's provider, or the information on the Website/Application. LearnED encourages the User to read the privacy policies of each such Website/Application and the User understands that it is solely such a third party who is responsible to the User in this regard. LearnED has taken reasonable precautions as per applicable Indian law and implemented industry standards to treat Personal Information as confidential and to protect it from unauthorized access, improper use or disclosure, modification and unlawful destruction or accidental loss of the Personal Information. We will not use or share your information with anyone except as described in this Privacy Policy. Each time you use our Service you are accepting the practices described in this Privacy Policy at that time.`
  },
  {
    id: 'usage-retention',
    title: 'Usage and Retention of Information',
    content: `USAGE AND RETENTION OF INFORMATION

We obtain the information you provide when you access and register on the Application or Website or YouTube Channel or Services or products. When you register with us, you generally provide (a) your name, age, email address, location, phone number, password and your educational interests; (b) transaction-related information, such as when you make purchases, respond to any offers, or download or use applications from us; (c) information you provide us when you contact us for help; (d) information you enter into our system when using the Application/Website/YouTube Channel/Services/products, such as while asking doubts, participating in discussions and taking tests. The said information collected from the users could be categorized as "Personal Information", "Sensitive Personal Information" and "Associated Information". Personal Information, Sensitive Personal Information and Associated Information (each as individually defined under this Information Technology (Reasonable security practices and procedures and sensitive personal data or information) Rules, 2011 (the "Data Protection Rules")) shall collectively be referred to as 'Information' in this Policy. We may use the Information to contact you from time to time, to provide you with the Services, important information, required notices and marketing promotions. We will use your personal information to provide, analyze, administer and improve our services, to provide you with a personalized experience on our Website/Application (especially, by offering you services that is best suited for you), to contact you about your account and our services, to provide you customer service, to provide you with personalized marketing and to detect, prevent, mitigate and investigate fraudulent or illegal activities. We further use your personal information to determine your general geographic location, provide localized courses and classes, provide you with customized and personalized study material, recommendations, determine your Internet service provider, and help us quickly and efficiently respond to inquiries and requests and enforcing our terms and communicate with you concerning our service (for example by email, WhatsApp, push notifications, text messaging, and online messaging channels), so that we can send you details about new features and content available on the Website/Application, special offers, promotional announcements, surveys, and to assist you with operational requests such as password reset requests.`
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: `COOKIES

We send cookies (small files containing a string of characters) to your computer, thereby uniquely identifying your browser. Cookies are used to track your preferences, help you login faster, and aggregated to determine user trends. This data is used to improve our offerings, such as providing more content in areas of greater interest to a majority of users. Most browsers are initially set up to accept cookies, but you can reset your browser to refuse all cookies or to indicate when a cookie is being sent. Some of our features and services may not function properly if your cookies are disabled.`
  },
  {
    id: 'sharing-disclosure',
    title: 'Sharing and Disclosing Personal Information',
    content: `SHARING AND DISCLOSING PERSONAL INFORMATION

We use other companies, agents or contractors ("Service Providers") to perform services on our behalf or to assist us with the provision of services to you. We engage Service Providers to provide marketing, advertising, communications, infrastructure and IT services, to personalize and optimize our service, to process credit card transactions or other payment methods, to provide customer service, to collect debts, to analyse and enhance data, and to process and administer consumer surveys. In the course of providing such services, these Service Providers may have access to your personal or other information. We do not authorize them to use or disclose your personal information except in connection with providing their services. We shall use Your Personal Information to ensure services with respect to the Platform are presented to You in the most effective manner, to secure the Platform and make improvements, to carry out our obligations to You, and to communicate with You. The said communication can either be by calls, text or emails and for purposes which include transactional, service, or promotional calls or messages. If at any time You wish to not receive any communication from our end You can opt-out of the same by writing to us.`
  },
  {
    id: 'information-security',
    title: 'Information Security',
    content: `INFORMATION SECURITY

We do not sell, transfer or rent your personal information to third parties for their marketing purposes without your explicit consent and we only use your information as described in the Privacy Policy. We view protection of your privacy as a very important community principle. We understand clearly that you and your Information is one of our most important assets. We store and process your personal information on computers located in India that are protected by physical as well as technological security devices. We use third parties to verify and certify our privacy principles. If you object to your Information being transferred or used in this way, please do not use this Website/Application. Under no circumstances, we rent, trade, transfer or share your personal information that we have collected with any other company for their marketing purposes without your consent. We reserve the right to communicate your personal information to any third party that makes a legally-compliant request for its disclosure.`
  },
  {
    id: 'public-forums',
    title: 'Public Forums',
    content: `PUBLIC FORUMS

When you use certain features on our Website/Application/YouTube Channel like the discussion forums and you post or share your personal information such as comments, messages, files, photos, will be available to all users, and will be in the public domain. All such sharing of information is done at your own risk. Please keep in mind that if you disclose personal information in your profile or when posting on our forums this information may become publicly available.`
  },
  {
    id: 'consulting',
    title: 'Consulting',
    content: `CONSULTING

We use third parties to help us provide services to You including the fulfillment of service, processing of payments, monitoring site activity, conducting surveys, maintaining our database, administering emails, and administering contents, and to provide aggregate, comparative information on the performance of our Website/Application to us and a select group.`
  },
  {
    id: 'user-customs',
    title: 'User Customs',
    content: `USER CUSTOMS

It is open for you to customize our usage of your personal information to communicate with you, to send you marketing information, how we provide you with customized and relevant advertising, and whether you want to stay signed into your account. If you do not wish to receive marketing communications from us, you can unsubscribe from the link in the email you would receive or change your communication preferences or indicate your communication preferences. You can also reach us via email to block promotional communication to you. Keep in mind, we do not sell or rent your personal information to third parties for their marketing purposes without your explicit consent.`
  },
  {
    id: 'ownership-rights',
    title: 'Ownership of Rights',
    content: `OWNERSHIP OF RIGHTS

All rights, including copyright, in this Website/Application are owned by or licensed to us. Any use of this Website/Application or its contents, including copying or storing it or them in whole or part, other than for your own personal, non-commercial use is prohibited without our permission. You are prohibited from modifying, copying, distributing, transmitting, displaying, printing, publishing, selling, licensing, creating derivative works or using any content available on or through our Website/Application for commercial or public purposes. You may not modify, distribute or re-post something on this Website/Application for any purpose. You acknowledge that you do not acquire any ownership rights by downloading copyrighted material. Trademarks that are located within or on our Website/Application or a Website/Application otherwise owned or operated in conjunction with LearnED shall not be deemed to be in the public domain but rather the exclusive property of LearnED, unless such site is under license from the trademark owner thereof in which case such license is for the exclusive benefit and use of LearnED, unless otherwise stated.`
  },
  {
    id: 'consent',
    title: 'Consent',
    content: `CONSENT

We believe that, every user of our YouTube Channel/Services/products/Website/Application must be in a position to provide an informed consent prior to providing any Information required for the use of the YouTube Channel/Services/products/Website/Application but in case of minors, consent for retention of data is deemed to be given by their guardians/parents. By registering with us, you are expressly consenting to our collection, processing, storing, disclosing and handling of your information as set forth in this Policy now and as amended by us. It is implied that at the time of registration the parents/guardians of a minor agree to the privacy policy and terms and conditions of the company. Processing your information in any way, including, but not limited to, collecting, storing, deleting, using, combining, sharing, transferring and disclosing information, all of which activities will take place in India. If you reside outside India your information will be transferred, processed and stored in accordance with the applicable data protection laws of India. By submitting content on or through the Services (your "Material"), you grant us a worldwide, non-exclusive, royalty-free license (with the right to sublicense) to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such Material in any and all media or distribution methods (now known or later developed) and to associate your Material with you, except as described below. You agree that others may use Your Material in the same way as any other content available through the Services. Other users of the Services may fork, tweak and repurpose your Material in accordance with these Terms. If you delete your user account your Material and name may remain available through the Services. The user hereby consents to the use by LearnED of his/her name, age, photograph, videos, voice recordings, rank, statements and/or testimonials ("Personal Attributes") for the purpose of publication, advertising, promotion on its online platforms, including but not limited to the Platform, and through any mode, medium, platform and/or format, including without limitation, in newspapers, magazines, other print media, on television, radio, internet and other electronic and/or in mailings for educational awareness. Any testimonial or statements provided by the Participant and any other details pertaining to their use of the Platform, content available of the Platform, shall be exclusively provided to LearnED and the Participant warrants to that extent. Any marketing material created by LearnED using a Participant's Personal Attributes shall remain the sole property of LearnED, and the Participant shall have no claim of any nature against the same. The Participant understands that the use of his/her Personal Attributes by LearnED shall be made at its sole discretion without any further notice to the Participant. LearnED shall have no obligation to consider Participant's inputs or feedback on the use of his/her Personal Attributes. The Participant shall release, waive, and discharge claims of any kind or nature arising out of or relating to the use of his/her Personal Attributes against LearnED or any person or firm authorized by LearnED to publish the same in accordance with the terms hereof. Such release, waiver and discharge shall also extend to all group companies, affiliated companies, subsidiaries, shareholders, directors, officers, employees, agents and assigns of LearnED and any publishers of the Personal Attributes in accordance with the terms hereof. Such a release shall be binding on the Participant, his/her respective successors, heirs, assigns, executors, administrators, spouse and next of kin. The Participant hereby confirms that the chance provided by LearnED to be recognized as a rank-holder in the exam(s) in accordance with these Feature Terms, is sufficient consideration for the use of Participant's Personal Attributes by LearnED in accordance with the terms hereof, and LearnED shall have no liability to pay any consideration for any use of the Participant's Personal Attributes in accordance with these Feature Terms.`
  },
  {
    id: 'exclusive-service',
    title: 'Exclusive Service',
    content: `EXCLUSIVE SERVICE

By having a LearnED account, you explicitly consent to camera and microphone permissions required to make video calls and related recordings where applicable.`
  },
  {
    id: 'security',
    title: 'Security',
    content: `SECURITY

We are concerned about safeguarding the confidentiality of your Information. We provide physical, electronic, and procedural safeguards to protect Information we process and maintain. For example, we limit access to this Information to authorized employees only who need to know that information in order to operate, develop or improve our YouTube Channel/Services/products/Website/Application. Please be aware that, although we endeavor to provide reasonable security for information we process and maintain, no security system can prevent all potential security breaches.

LearnED MAY DISCLOSE INFORMATION IN THE FOLLOWING SITUATION:
• as required by law;
• to enforce applicable "Terms of Use", including investigation of potential violations thereof;
• when we believe in good faith that the disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, address security or technical issues or respond to a government request;
• with our trusted service providers.

CONSENT TO THIS POLICY 
The Terms of Use Agreement is incorporated herein by reference in its entirety. By submitting data to us or our agent or using the Site, you consent to our use of your data in the manner set out in this Privacy Policy.`
  },
  {
    id: 'updates-policy',
    title: 'Updates to Policy',
    content: `UPDATES TO POLICY

As the Company evolves, our privacy policy will need to evolve as well to cover new situations. You are advised to review this Policy regularly for any changes, as continued use is deemed approval of all changes.`
  },
  {
    id: 'limitation-liability',
    title: 'Limitation of Liability',
    content: `LIMITATION OF LIABILITY

The user acknowledge that the company is not the manufacturer of the content on the Website or Application or YouTube Channel and shall not be liable for any repercussions for the content. In no event shall the Company, its officers, directors, employees, partners or agents be liable to You or any third party for any special, incidental, indirect, consequential or punitive damages whatsoever, including those resulting from loss of use, data or profits or any other claim arising out of, or in connection with, Your use of, or access to, the Website/Application/YouTube Channel.

In the event of Your breach of these Terms, you agree that the Company will be irreparably harmed and may not have an adequate remedy in money or damages. The Company therefore, shall be entitled in such event to obtain an injunction against such a breach from any court of competent jurisdiction. The Company's right to obtain such relief shall not limit its right to obtain other remedies. Any violation by You of the terms of this Clause may result in immediate suspension or termination of Your Accounts apart from any legal remedy that the Company can avail. In such instances, the Company may also disclose Your Account Information if required by any Governmental or legal authority. You understand that the violation of these Terms could also result in civil or criminal liability under applicable laws.`
  },
  {
    id: 'refund-policy',
    title: 'Refund Policy',
    content: `Refund Policy

When you buy our products/services, your purchase is not entitled for any refund. If you buy any online batch/service, it is non-refundable. If you purchase any batch by mistake, you can request to change it to another batch of the same amount within 10 days of the purchase. We recommend you to first check the complete system and then decide to make a payment in case of books. If the product received is damaged/lost by the courier partner, the student is entitled for a replacement. However, in case of wrong address given or books not accepted by students the purchase will not be entitled for any kind of refund.`
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    content: `CONTACT US:

  If you have any questions about this Privacy Policy, You can contact us:
  • By visiting this page on our Website/Application: https://learnedtech.in/
  • By emailing us at: support@learnedtech.in`
  }
];

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getSectionBody = (section) => {
    const trimmedContent = section.content.trimStart();
    const lines = trimmedContent.split('\n');
    const firstLine = (lines[0] || '').trim();

    const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalize(firstLine) === normalize(section.title)) {
      return lines.slice(1).join('\n').trimStart();
    }

    return section.content;
  };

  return (
    <div className="pt-16 bg-slate-50 min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#ef4444_0%,_transparent_55%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-5">
              <FileText className="w-4 h-4" />
              Legal Agreement
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">Terms and Conditions</h1>
            <p className="text-slate-200 text-lg md:text-xl max-w-3xl">
              Please read our comprehensive terms and conditions carefully before using LearnED services.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">On this page</h2>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-sm text-slate-600 hover:text-red-600 transition-colors"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
              className="lg:col-span-8 xl:col-span-9 rounded-3xl border border-slate-200 bg-white shadow-sm p-6 md:p-10"
            >
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28 pb-8 mb-8 border-b border-slate-100 last:mb-0 last:pb-0 last:border-b-0">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4">{section.title}</h3>
                  <pre className="whitespace-pre-wrap text-justify text-slate-700 leading-8 text-base font-sans">
                    {getSectionBody(section)}
                  </pre>
                </section>
              ))}
            </motion.article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
