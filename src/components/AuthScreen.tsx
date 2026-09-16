import React, { useState } from 'react';
import { Sparkles, Shield, Heart, ArrowRight, CheckCircle2, Lock, Mail, User, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register, demoLogin, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('alex@vibematch.app');
  const [password, setPassword] = useState<string>('demo123456');
  const [firstName, setFirstName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('2000-05-15');
  const [gender, setGender] = useState<string>('woman');
  const [interestedIn, setInterestedIn] = useState<string>('everyone');
  const [city, setCity] = useState<string>('New York, NY');
  const [acceptedAgeTerms, setAcceptedAgeTerms] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!acceptedAgeTerms) {
          setError('You must verify you are at least 18 years old to join.');
          return;
        }
        await register({
          email,
          password,
          firstName,
          birthDate,
          gender,
          interestedIn,
          city,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleDemo = async (role: 'user' | 'admin') => {
    setError(null);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] flex flex-col justify-center items-center p-4 relative overflow-hidden text-white selection:bg-rose-500 selection:text-white">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-rose-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-pink-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 p-0.5 shadow-2xl shadow-rose-500/30 mb-2">
            <div className="w-full h-full bg-[#0F131D] rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-400">
            VibeMatch
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
            Meet genuine people. Share true vibes. Make lasting connections.
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="p-3.5 rounded-2xl bg-[#131824]/90 border border-white/10 backdrop-blur-md space-y-2 text-xs">
          <div className="flex items-center justify-between text-gray-300">
            <span className="font-semibold text-rose-300">⚡ Instant 1-Click Demo Evaluation:</span>
            <span className="text-[10px] text-gray-400">Pre-seeded accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-demo-login-user"
              type="button"
              onClick={() => handleDemo('user')}
              disabled={isLoading}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30 border border-rose-500/30 text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>Explore as Alex</span>
            </button>
            <button
              id="btn-demo-login-admin"
              type="button"
              onClick={() => handleDemo('admin')}
              disabled={isLoading}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-sky-500/20 hover:from-indigo-500/30 hover:to-sky-500/30 border border-indigo-500/30 text-sky-300 font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Safety Admin</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#121622]/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-[#1A202E] rounded-2xl border border-white/5 text-xs">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                mode === 'login' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-semibold transition-all ${
                mode === 'register' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      id="input-reg-firstname"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your preferred name"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1 font-medium">Date of Birth (18+)</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        id="input-reg-birthdate"
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full pl-9 pr-2 py-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500 text-[11px]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-medium">City</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        id="input-reg-city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Austin, TX"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1 font-medium">I am a</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full p-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="woman">Woman</option>
                      <option value="man">Man</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 font-medium">Interested in</label>
                    <select
                      value={interestedIn}
                      onChange={(e) => setInterestedIn(e.target.value)}
                      className="w-full p-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="men">Men</option>
                      <option value="women">Women</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#171D2B] rounded-xl border border-white/10 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-300">
                <input
                  id="checkbox-age-terms"
                  type="checkbox"
                  checked={acceptedAgeTerms}
                  onChange={(e) => setAcceptedAgeTerms(e.target.checked)}
                  className="mt-0.5 accent-rose-500"
                />
                <label htmlFor="checkbox-age-terms">
                  I confirm that I am at least 18 years of age and agree to the Community Guidelines & Safe Dating Pledge.
                </label>
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-xl shadow-rose-500/25 transition-all"
            >
              <span>{isLoading ? 'Please wait...' : mode === 'login' ? 'Enter VibeMatch' : 'Complete Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Community Trust Badge */}
        <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span>Protected with end-to-end moderation, photo verification & privacy controls</span>
        </div>
      </div>
    </div>
  );
};
