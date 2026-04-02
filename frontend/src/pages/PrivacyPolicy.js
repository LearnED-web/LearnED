import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const introText = `LearnED Privacy Policy 

Please read the following Privacy policy of the services made available on www.learnedtech.in or the equivalent LearnED Mobile Application available on Google Play, ("LearnED App"/ "Website"). The LearnED App or Website on which the Services are availed may together be referred to for convenience as the "Platform". Please ensure that this Privacy Policy is perused by You before availing any services from Us. This Privacy Policy shall be updated from time to time and to stay abreast with our methods of using Your information and protecting Your privacy, please keep reviewing this Policy. 

By viewing the LearnED Platform, you agree to be bound by the terms of this Privacy Policy. 

By using the LearnED Platform and/or by providing Your information, You consent to the collection and use of the information You disclose on our Website in accordance with this Privacy Policy, including but not limited to your consent for sharing your information as per this Privacy Policy. If we decide to change our Privacy Policy, We will post those changes on this page so that You are always aware of what information We collect, how We use it, and under what circumstances We disclose it. If You do not agree for the forgoing, please do not continue to use or access our Website.`;

const sections = [
  {
    id: 'collection',
    title: '1) Collection of Personally Identifiable Information',
    content: `1. Collection of Personally Identifiable Information 
1.1 We collect certain information about You to help us serve You better. The 
information collected by Us is of the following nature: 
• Name 
• Telephone Number 
• Email Address 
• Service Address 
• Other information about the service address which You give Us 
• Your IP address 
• Information about your device 
• Network information 
• College/ Institution Details and location 
• User uploaded photo and IDs 
• Demographic information such as postcode, preferences and interests 
• Any other personal information which you give us in connection while booking a service or is relevant to customer surveys and/or offers. 
1.2 Information provided during Registration to create a profile and use this Website and 
services, you may be asked to provide the following information: your name, your 
username, password, email address, the speciality in which you practice or intend to 
practice (selected from a drop-down menu if applicable), year of graduation or year of 
joining undergraduate medical program and the name of your college or university. You 
may also choose to provide a picture to be associated with your profile. 
1.3 We will store your username, country and specialty on an unencrypted server. Your 
password is cryptographically hashed and your email address is encrypted. These 
information elements are referred to collectively as your "Personal User Information." 
We collect and hold this information for the purpose of administering your use of the 
Application. 
1.4 You are solely responsible for 
1. Maintaining the strict confidentiality of your Personal User Information 
2. Not allowing another person to use your Personal User Information to access the 
Services 
3. Any and all damages or losses that may be incurred or suffered as a result of any 
activities that occur in your Account 
4. Ensuring that the information submitted by you complies with our terms and 
conditions 
5. Ensuring that the information provided by you is correct and updated from time to 
time. 
1.5 You agree to immediately notify LearnED in writing by email to support@learnedtech.in of any unauthorized use of your Personal User Information 
or any other breach of security. LearnED is not and shall not be liable for any harm 
arising from or relating to the theft of your Personal User Information that is under Your 
control, your disclosure of your Personal User Information, or the use of your Personal 
User Information by another person or entity. 
1.6 On receiving personal information about You, You no longer remain anonymous to 
Us. We may use this information to do internal research on demographics, interests, 
and behaviour to better understand, protect and serve our customers. This information 
is compiled and analysed on an aggregated basis. We indicate fields that are 
mandatory required to be filled and fields that are optional. You may decide whether or 
not to provide such information to Us. 
1.7 You may choose not to provide us with any personal information or information as 
required to provide any Services. If we do not receive information required, we may 
choose not to provide you with such Service. Service shall have the meaning attributed 
to the phrase in the Terms of Use. 
1.8 On our Website, you can browse without telling Us who you are or revealing any 
personal information about Yourself. We may automatically track certain information 
about You based on Your behaviour on our Website. This information may include the 
URL that You just came from (whether this URL is on our Website or not), which URL 
You next go to (whether this URL is on our Website or not), Your browser information, 
and Your IP address. 
1.9 On our Websites, We use data collection devices such as "cookies" on certain 
pages to help analyse our web page flow, measure promotional effectiveness, and 
promote trust and safety. "Cookies" are small files placed on your hard drive that assist 
Us in providing our services. We offer certain features that are only available through 
the use of a "cookie". You are always free to decline our cookies if Your browser 
permits, although in that case You may not be able to use certain features on the 
Websites. Additionally, You may encounter "Cookies" or other similar devices on certain 
pages of the Website that are placed by third parties. We do not control the use of 
cookies by third parties.`
  },
  {
    id: 'use',
    title: '2) Use of Personal Information',
    content: `2. Use of Personal Information 
2.1 The information collected by Us through our Website is used by Us for various 
purposes to enable us to serve you better: 
1. To find third party service providers 
2. Internal record keeping 
3. We may use the information to improve our products and services 
4. We may periodically send promotional emails or messages on the Website about 
new products, special offers or other information which We think You may find 
interesting using the email address which You have provided 
5. From time to time, we may use the information to customize the Website 
according to your interests. 
2.2 We may use personal information to resolve disputes that may arise with the use of 
our Services, help promote a safe service to all the customers, measure consumer 
interest in our services, customize your experience, detect and protect Us against error, 
fraud and other criminal activity, enforce our terms and conditions. 
2.3 We identify and use your IP address to help diagnose problems with our server, and 
to administer our Websites. Your IP address is also used to help identify You and to 
gather broad demographic information.`
  },
  {
    id: 'sharing',
    title: '3) Sharing of Personal Information',
    content: `3. Sharing of Personal Information 
3.1 We may share your information with payment service providers, regulatory 
authorities, and third-party agencies in the event of any request from such authorities. 
3.2 We may disclose Your personal information if required to do so by law or in the good 
faith and belief that such disclosure is reasonably necessary to respond to subpoenas, 
court orders, or other legal process. We may disclose personal information to law 
enforcement offices, third party rights owners, or others in the good faith belief that such 
disclosure is reasonably necessary to enforce our Terms or Privacy Policy; respond to 
claims that an advertisement, posting or other content violates the rights of a third party; 
or protect the rights, property or personal safety of our customers or the general public. 
3.3 We and our affiliates will share/sell some or all of the collected information with 
another business entity should We (or our assets) plan to merge with, or be acquired by 
that business entity, or re-organization, amalgamation, restructuring of business. Should 
such a transaction occur, that other business entity (or the new combined entity) will be 
required to follow this Privacy Policy with respect to all the information collected. 
3.4 We do not disclose personal information about identifiable individuals to advertisers, 
but We may provide them with aggregate and/or anonymised information about You to 
help advertisers reach the kind of audience they want to target. We may make use of 
the information We have collected from You to enable Us to comply with our advertisers' 
wishes by displaying their advertisement to that target audience. 
3.5 If you choose to subscribe to any LearnED plan you may be required to upload a 
copy of a valid government issued identification document to allow access to the 
Platform.`
  },
  {
    id: 'safety',
    title: '4) Information Safety',
    content: `4. Information Safety 
4.1 All information is saved and stored on servers which are secured with passwords 
and pins to ensure no unauthorised person has access to it. Once your information is in 
our possession we adhere to strict security guidelines, protecting it against unauthorized 
access.`
  },
  {
    id: 'opt-out',
    title: '5) Choice/Opt-Out',
    content: `5. Choice/Opt-Out 
5.1 We provide all customers with the opportunity to opt-out of receiving non-essential 
(promotional, marketing-related) communications from Us on behalf of our partners, and 
from Us in general, after providing Us with personal information. If You want to remove 
your contact information from all lists and newsletters, please write to 
[support@learnedtech.in]. 
All other terms and conditions as applicable under the Terms and Conditions of 
Use www.learnedtech.in will be applicable to You and will be read along with this 
Privacy Policy.`
  }
];

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const normalizeToken = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

  const shouldKeepLineBreak = (currentLine, nextLine) => {
    const current = currentLine.trim();
    const next = nextLine.trim();

    if (!current || !next) return true;
    if (current.endsWith(':')) return true;
    if (current.startsWith('•') || next.startsWith('•')) return true;
    
    // Only keep break if the NEXT line starts a new point
    if (/^\d+[.)]/.test(next)) return true;
    if (/^\d+\.\d+/.test(next)) return true;
    
    if (/^[A-Z][A-Z\s/&-]{3,}$/.test(next)) return true;

    return false;
  };

  const reflowContent = (value) => {
    const normalized = value.replace(/\r\n/g, '\n').trim();
    const lines = normalized.split('\n');
    let output = '';

    for (let i = 0; i < lines.length; i += 1) {
      const current = lines[i].trimEnd();
      const next = i < lines.length - 1 ? lines[i + 1] : '';
      output += current;

      if (i < lines.length - 1) {
        output += shouldKeepLineBreak(current, next) ? '\n' : ' ';
      }
    }

    return output;
  };

  const getSectionBody = (section) => {
    const trimmedContent = section.content.trimStart();
    const lines = trimmedContent.split('\n');
    const firstLine = (lines[0] || '').trim();
    const body = normalizeToken(firstLine) === normalizeToken(section.title)
      ? lines.slice(1).join('\n').trimStart()
      : section.content;

    return reflowContent(body);
  };

  const getIntroBody = () => {
    const trimmedContent = introText.trimStart();
    const lines = trimmedContent.split('\n');
    const firstLine = (lines[0] || '').trim();
    const body = normalizeToken(firstLine) === normalizeToken('LearnED Privacy Policy')
      ? lines.slice(1).join('\n').trimStart()
      : introText;

    return reflowContent(body);
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
              <Shield className="w-4 h-4" />
              Legal Policy
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">LearnED Privacy Policy</h1>
            <p className="text-slate-200 text-lg md:text-xl max-w-3xl">
              Your privacy is important to us. Read our official privacy policy below.
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
              <pre className="whitespace-pre-wrap text-justify text-slate-700 leading-8 text-base font-sans mb-8 pb-8 border-b border-slate-100">
                {getIntroBody()}
              </pre>

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

export default PrivacyPolicy;
