import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) {
      setError("Please agree to the Terms and Conditions");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            phone,
            role: "admin", // Default role
          },
        },
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto text-center">
        <div className="mb-6 overflow-hidden bg-brand-50/50 dark:bg-brand-500/5 rounded-2xl p-8 border border-brand-100 dark:border-brand-500/20">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-500/10 dark:bg-success-500/20">
              <svg
                className="w-6 h-6 text-success-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-800 dark:text-white/90">
            Registration Successful!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please check your email to verify your account before logging in.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Login
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8 text-center">
            <h1 className="mb-2 font-bold text-gray-800 text-title-md dark:text-white/90 sm:text-title-lg">
              Create POS Account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set up your terminal access by creating an account
            </p>
          </div>

          <form onSubmit={handleSignUp}>
            <div className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-white bg-error-500 rounded-lg animate-fade-in">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>
                    First Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFirstName(e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label>
                    Last Name<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLastName(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  type="text"
                  placeholder="+00 000 000 00"
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value)
                  }
                />
              </div>

              <div>
                <Label>
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Create a strong password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <div className="flex items-center">
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      </div>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1 w-5 h-5"
                  checked={isChecked}
                  onChange={setIsChecked}
                />
                <p className="text-sm font-normal text-gray-500 dark:text-gray-400 leading-relaxed">
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and our{" "}
                  <Link
                    to="/privacy"
                    className="text-brand-500 hover:text-brand-600"
                  >
                    Privacy Policy
                  </Link>
                </p>
              </div>

              <div>
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              Already have an account? {""}
              <Link
                to="/"
                className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
