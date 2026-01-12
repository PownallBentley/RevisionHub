// src/pages/Landing.tsx

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart,
  faUserGraduate,
  faChalkboardTeacher
} from "@fortawesome/free-solid-svg-icons";
import Footer from "../components/layout/Footer";

export default function Landing() {
  return (
    <div className="bg-neutral-0 flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50/30 via-white to-white pt-12 pb-20">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-neutral-800 leading-tight">
                Confident revision,<br />
                <span className="text-primary-600">without the stress</span>
              </h1>
              <p className="text-lg text-neutral-600 leading-relaxed">
                Help your child stay on track with personalized GCSE revision plans.
                Get clear insights into their progress and never worry about exam prep again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  to="/signup"
                  className="px-7 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-semibold text-center shadow-sm"
                >
                  Get started free
                </Link>
                <button className="px-7 py-3 border-2 border-neutral-200 text-neutral-700 rounded-full hover:border-neutral-300 hover:bg-neutral-50 transition-colors font-semibold">
                  Watch demo
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-primary-50 rounded-2xl shadow-lg border border-primary-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-800">Emma's Progress</h3>
                  <span className="px-3 py-1.5 bg-accent-green text-white text-xs font-semibold rounded-full">On Track</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl text-center border border-neutral-200/50 shadow-sm">
                    <div className="text-3xl font-bold text-accent-green mb-1">85%</div>
                    <div className="text-xs text-neutral-600 font-medium">Maths</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border border-neutral-200/50 shadow-sm">
                    <div className="text-3xl font-bold text-primary-600 mb-1">92%</div>
                    <div className="text-xs text-neutral-600 font-medium">English</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl text-center border border-neutral-200/50 shadow-sm">
                    <div className="text-3xl font-bold text-accent-amber mb-1">78%</div>
                    <div className="text-xs text-neutral-600 font-medium">Science</div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700 font-medium">This week's sessions</span>
                    <span className="font-semibold text-neutral-800">8 of 10 completed</span>
                  </div>
                  <div className="w-full bg-primary-200/40 rounded-full h-2.5">
                    <div className="bg-primary-600 h-2.5 rounded-full transition-all" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Path Section */}
      <section className="py-20 bg-neutral-0">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-900 mb-4">Choose your path</h2>
            <p className="text-xl text-neutral-600">Get started with the experience that's right for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-primary-200 rounded-2xl p-8 text-center hover:border-primary-400 hover:shadow-lg transition-all shadow-soft">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faHeart} className="text-primary-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-3">I'm a parent</h3>
              <p className="text-neutral-600 mb-6">Monitor your child's progress, get insights, and ensure they're prepared for their GCSEs.</p>
              <Link
                to="/signup"
                className="block w-full px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-semibold shadow-sm"
              >
                Start as parent
              </Link>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center hover:border-primary-300 transition-colors shadow-soft">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faUserGraduate} className="text-neutral-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-3">I'm a student</h3>
              <p className="text-neutral-600 mb-6">Access personalized revision plans, track your progress, and ace your GCSE exams.</p>
              <Link
                to="/signup"
                className="block w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                Start as student
              </Link>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center hover:border-primary-300 transition-colors shadow-soft">
              <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="text-neutral-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-3">I'm a teacher</h3>
              <p className="text-neutral-600 mb-6">Help your students succeed with classroom tools and progress monitoring.</p>
              <Link
                to="/signup"
                className="block w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-full hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                Start as teacher
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-900 mb-4">How it works</h2>
            <p className="text-xl text-neutral-600">Get your child exam-ready in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">Set up your child's profile</h3>
              <p className="text-neutral-600">Tell us about your child's subjects, exam dates, and current confidence levels.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">Get a personalized plan</h3>
              <p className="text-neutral-600">We create a tailored revision schedule that fits around your child's life and learning style.</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">Track progress together</h3>
              <p className="text-neutral-600">Monitor your child's progress with clear insights and celebrate their achievements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-neutral-0">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-900 mb-4">Why parents choose RevisionHub</h2>
            <p className="text-xl text-neutral-600">Trusted by thousands of families across the UK</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center mb-4">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="Parent" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <div className="font-semibold text-neutral-700">Sarah M.</div>
                  <div className="text-sm text-neutral-500">Mother of 2</div>
                </div>
              </div>
              <p className="text-neutral-600 italic">"Finally, I can see exactly how my daughter is progressing. The stress of not knowing where she stands has completely disappeared."</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center mb-4">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Parent" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <div className="font-semibold text-neutral-700">James K.</div>
                  <div className="text-sm text-neutral-500">Father of 1</div>
                </div>
              </div>
              <p className="text-neutral-600 italic">"My son went from dreading revision to actually enjoying it. The personalized approach really works."</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-center mb-4">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" alt="Parent" className="w-12 h-12 rounded-full mr-4" />
                <div>
                  <div className="font-semibold text-neutral-700">Emma T.</div>
                  <div className="text-sm text-neutral-500">Mother of 3</div>
                </div>
              </div>
              <p className="text-neutral-600 italic">"Having clear visibility into all three of my children's revision progress has been a game-changer for our family."</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-50">
        <div className="max-w-[1120px] mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-900 mb-4">Ready to transform revision time?</h2>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Join thousands of parents who've already taken the stress out of GCSE preparation.
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-medium"
            >
              Start free trial
            </Link>
            <button className="px-8 py-3 border border-primary-300 text-primary-600 rounded-full hover:bg-primary-100 transition-colors font-medium">
              Book a demo
            </button>
          </div>
          <p className="text-sm text-neutral-500 mt-4">Free for 14 days. Cancel anytime.</p>
        </div>
      </section>

      {/* Shared Footer Component */}
      <Footer />
    </div>
  );
}