import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGraduationCap,
  faHeart,
  faUserGraduate,
  faChalkboardTeacher
} from "@fortawesome/free-solid-svg-icons";

export default function Landing() {
  return (
    <div className="bg-neutral-0">
      <header className="bg-neutral-0 border-b border-neutral-200">
        <div className="max-w-content mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faGraduationCap} className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-primary-900">ReviseWise</span>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-primary-600 text-white rounded-pill hover:bg-primary-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary-50 via-neutral-50 to-neutral-0 min-h-[600px]">
        <div className="max-w-content mx-auto px-6 pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-primary-900 leading-tight">
                Confident revision,<br />
                <span className="text-primary-600">without the stress</span>
              </h1>
              <p className="text-xl text-neutral-600 leading-relaxed">
                Help your child stay on track with personalized GCSE revision plans.
                Get clear insights into their progress and never worry about exam prep again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  to="/signup"
                  className="px-8 py-3 bg-primary-600 text-white rounded-pill hover:bg-primary-700 transition-colors font-medium text-center"
                >
                  Get started free
                </Link>
                <button className="px-8 py-3 border border-neutral-300 text-neutral-700 rounded-pill hover:border-primary-300 hover:text-primary-600 transition-colors font-medium">
                  Watch demo
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-700">Emma's Progress</h3>
                  <span className="px-3 py-1 bg-accent-green text-white text-sm rounded-pill">On Track</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-neutral-50 p-3 rounded-xl text-center">
                    <div className="text-2xl font-bold text-primary-600">85%</div>
                    <div className="text-sm text-neutral-500">Maths</div>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-xl text-center">
                    <div className="text-2xl font-bold text-primary-600">92%</div>
                    <div className="text-sm text-neutral-500">English</div>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-xl text-center">
                    <div className="text-2xl font-bold text-accent-amber">78%</div>
                    <div className="text-sm text-neutral-500">Science</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">This week's sessions</span>
                    <span className="font-medium text-neutral-700">8 of 10 completed</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-0">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary-900 mb-4">Choose your path</h2>
            <p className="text-xl text-neutral-600">Get started with the experience that's right for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border-2 border-primary-200 rounded-2xl p-8 text-center hover:border-primary-400 transition-colors shadow-soft">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faHeart} className="text-primary-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">I'm a parent</h3>
              <p className="text-neutral-600 mb-6">Monitor your child's progress, get insights, and ensure they're prepared for their GCSEs.</p>
              <Link
                to="/signup"
                className="block w-full px-6 py-3 bg-primary-600 text-white rounded-pill hover:bg-primary-700 transition-colors"
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
                className="block w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-pill hover:border-primary-300 hover:text-primary-600 transition-colors"
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
                className="block w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-pill hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                Start as teacher
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-neutral-50">
        <div className="max-w-content mx-auto px-6">
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

      <section className="py-20 bg-neutral-0">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-primary-900 mb-4">Why parents choose ReviseWise</h2>
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

      <section className="py-20 bg-primary-50">
        <div className="max-w-content mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-900 mb-4">Ready to transform revision time?</h2>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Join thousands of parents who've already taken the stress out of GCSE preparation.
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 bg-primary-600 text-white rounded-pill hover:bg-primary-700 transition-colors font-medium"
            >
              Start free trial
            </Link>
            <button className="px-8 py-3 border border-primary-300 text-primary-600 rounded-pill hover:bg-primary-100 transition-colors font-medium">
              Book a demo
            </button>
          </div>
          <p className="text-sm text-neutral-500 mt-4">Free for 14 days. Cancel anytime.</p>
        </div>
      </section>

      <footer className="bg-neutral-700 text-neutral-300 py-12">
        <div className="max-w-content mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-white text-lg" />
                </div>
                <span className="text-xl font-bold text-white">ReviseWise</span>
              </div>
              <p className="text-neutral-400">Helping students achieve their best in GCSE and IGCSE exams.</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Help center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-600 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; {new Date().getFullYear()} ReviseWise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}