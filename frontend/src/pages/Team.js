import React, { useEffect, memo } from 'react';
import { Heart, BookOpen, Award, Users, Lightbulb, Target } from 'lucide-react';

const Team = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const founders = [
    {
      name: "Rahul Nallana",
      position: "Founder & CEO",
      description: "Rahul is the visionary behind our platform, dedicated to creating impactful educational experiences and driving innovation at every step. He leads the team with empathy and a commitment to student-centric progress.",
      image: "/rahul.png",
      expertise: "Educational Innovation & Leadership"
    },
    {
      name: "Sayan Patra",
      position: "Co-Founder",
      description: "Sayan believes in building a collaborative and inclusive culture that brings out the best in both educators and learners. He ensures every initiative aligns with our mission of meaningful, value-driven education.",
      image: "/sayan.png",
      expertise: "Culture Building & Strategic Planning"
    },
    {
      name: "Hrishitha Sree",
      position: "Co-Founder",
      description: "Hrishitha is passionate about holistic development and fosters an environment where creativity and growth thrive for both students and educators. She focuses on continuous improvement and nurturing supportive relationships across the team.",
      image: "/hrishitha.png",
      expertise: "Holistic Development & Relationship Building"
    }
  ];

  const tutors = [
    {
      name: "Rahul Nallana",
      position: "Mathematics Tutor",
      description: "Rahul brings maths to life with interactive lessons that turn challenges into opportunities for growth. He helps students build confidence and lifelong numeracy skills.",
      image: "/rahul.png",
      subjects: ["Mathematics"],
      experience: "5+ years"
    },
    {
      name: "Sayan Patra",
      position: "Science Tutor",
      description: "Sayan simplifies complex concepts, making science fun and accessible for all learners. He fosters inquisitiveness and clarity, building a strong foundation for scientific thought.",
      image: "/sayan.png",
      subjects: ["Science"],
      experience: "4+ years"
    },
    {
      name: "Hrishitha Sree",
      position: "Mathematics, Science and English Tutor",
      description: "Hrishitha guides students to excel across subjects, combining analytical and creative approaches for holistic learning. She creates a safe space for questions, collaboration, and confidence-building.",
      image: "/hrishitha.png",
      subjects: ["Mathematics", "Science", "English"],
      experience: "6+ years"
    },
    {
      name: "Dharsanya",
      position: "Mathematics and Social Science Tutor",
      description: "Dharsanya is dedicated to making maths approachable, encouraging persistence and understanding. She supports every learner with patience, careful guidance, and practical problem-solving.",
      image: "/dharsanya.png",
      subjects: ["Mathematics", "Social Science"],
      experience: "3+ years"
    },
    {
      name: "Namrata",
      position: "Science and English Tutor",
      description: "Namrata inspires confidence in communication, helping students master English with enthusiasm and support. She encourages learners to express themselves creatively and develop a passion for language.",
      image: "/namrata.png",
      subjects: ["Science", "English"],
      experience: "4+ years"
    }
  ];

  const developers = [
    {
      name: "Pavan Deekshith",
      role: "Full Stack Developer",
      description: "Pavan is a passionate developer who brings ideas to life through clean, efficient code. He specializes in building intuitive user experiences and robust backend systems that power the LearnED platform.",
      image: null
    },
    {
      name: "Raghavpravin KS",
      role: "Full Stack Developer",
      description: "Raghavpravin is a dedicated developer focused on creating seamless digital experiences. He combines technical expertise with creative problem-solving to deliver innovative solutions for LearnED.",
      image: null
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Passionate Teaching",
      description: "Our educators bring enthusiasm and dedication to every lesson, inspiring students to love learning."
    },
    {
      icon: BookOpen,
      title: "Traditional Excellence",
      description: "We believe in time-tested educational methods that have proven successful across generations."
    },
    {
      icon: Award,
      title: "Academic Achievement",
      description: "We strive for excellence and help every student reach their highest potential."
    },
    {
      icon: Users,
      title: "Student-Centered",
      description: "Every decision we make is focused on what's best for our students' growth and development."
    },
    {
      icon: Lightbulb,
      title: "Innovative Methods",
      description: "Blending traditional teaching with modern interactive techniques for enhanced learning."
    },
    {
      icon: Target,
      title: "Personalized Approach",
      description: "Adapting teaching methods to each learner's unique needs and learning style."
    }
  ];

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-red-600 via-red-700 to-black text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Meet Our <span className="text-red-200">Amazing Team</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            "Empowering minds, one lesson at a time."
          </p>
          <p className="text-lg text-red-100 max-w-4xl mx-auto">
            Meet the passionate educators and visionary leaders who make learning an extraordinary journey through their 
            dedication, expertise, and unwavering commitment to student success.
          </p>
        </div>
      </section>

      {/* Our Leaders Section */}
      <section className="section-padding bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Our <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Founding Leaders</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The visionary minds behind LearnED who are committed to transforming education through innovation, 
              empathy, and student-centered approaches.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {founders.map((founder, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="text-center mb-6">
                  <img
                    src={founder.image}
                    alt={founder.name}
                    loading="lazy"
                    decoding="async"
                    className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-red-100"
                  />
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{founder.name}</h3>
                  <p className="text-red-600 font-semibold mb-2">{founder.position}</p>
                  <p className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mb-3">
                    {founder.expertise}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-700 leading-relaxed text-sm">{founder.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Values */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Our <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Core Values</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide our teaching philosophy and shape every interaction with our students
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full mb-6">
                  <value.icon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Expert Tutors */}
      <section className="section-padding bg-gradient-to-br from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Our <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Expert Tutors</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet our dedicated educators who bring passion, expertise, and personalized attention to every student's learning journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutors.map((tutor, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center mb-6">
                  <img
                    src={tutor.image}
                    alt={tutor.name}
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-3 border-blue-100"
                  />
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{tutor.name}</h3>
                  <p className="text-blue-600 font-semibold mb-2">{tutor.position}</p>
                  <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block mb-2">
                    {tutor.experience}
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center mb-3">
                    {tutor.subjects.map((subject, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-700 leading-relaxed text-sm">{tutor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Developers */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Our <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Developers</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the talented developers who built and maintain the LearnED platform, bringing our educational vision to life through technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {developers.map((developer, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center mb-6">
                  {developer.image ? (
                    <img
                      src={developer.image}
                      alt={developer.name}
                      loading="lazy"
                      decoding="async"
                      className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-purple-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 mx-auto mb-4 border-4 border-purple-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-purple-600">
                        {developer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{developer.name}</h3>
                  <p className="text-purple-600 font-semibold mb-2">{developer.role}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-700 leading-relaxed text-sm">{developer.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teaching Philosophy */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
              Our <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">Teaching Philosophy</span>
            </h2>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 md:p-12 border border-red-200">
              <div className="text-lg md:text-xl text-gray-700 leading-relaxed space-y-6">
                <p>
                  At LearnED, we believe that every student is unique, with their own learning style, 
                  pace, and potential. Our educators are not just teachers; they are mentors, guides, 
                  and cheerleaders who understand that education is about more than just transferring knowledge.
                </p>
                
                <p>
                  We combine <span className="font-semibold text-red-600">traditional teaching methods</span> that 
                  have stood the test of time with innovative approaches that engage today's learners. 
                  Our classrooms are spaces where curiosity is encouraged, questions are welcomed, 
                  and mistakes are seen as learning opportunities.
                </p>
                
                <p>
                  Every member of our team is committed to creating an environment where students feel 
                  supported, challenged, and inspired to reach their full potential. We measure our success 
                  not just in test scores, but in the confidence, critical thinking skills, and love of 
                  learning that our students develop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(Team);
