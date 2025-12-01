import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFeaturedCourses, getCategories } from "../../api/courseApi";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader/Loader";
import { toast } from "react-toastify";
import "./Home.css";

const CATEGORY_ICONS = {
  "Development": "💻",
  "Business": "📊",
  "Design": "🎨",
  "Marketing": "📢",
  "IT & Software": "🔧",
  "Data Science": "📈",
  "AI / Machine Learning": "🤖",
  "Web Development": "🌐",
  "Mobile Development": "📱",
  "Cloud Computing": "☁️",
  "Cyber Security": "🔒",
  "Python Programming": "🐍",
  "Data Structures": "🏗️"
};

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Software Developer at Google",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "SmartEdu helped me transition from a junior developer to a senior role. The courses are incredibly well-structured!",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Data Scientist",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "The AI and Machine Learning courses here are top-notch. I landed my dream job after completing just 3 courses!",
    rating: 5
  },
  {
    name: "Emily Davis",
    role: "Product Manager at Meta",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    text: "Best investment I've made in my career. The quizzes really help reinforce what you learn.",
    rating: 5
  }
];

const STATS = [
  { value: "50K+", label: "Active Learners" },
  { value: "500+", label: "Expert Courses" },
  { value: "100+", label: "Top Instructors" },
  { value: "95%", label: "Satisfaction Rate" }
];

const DEFAULT_CATEGORIES = [
  { name: "Web Development", count: 45 },
  { name: "Data Science", count: 32 },
  { name: "AI / Machine Learning", count: 28 },
  { name: "Mobile Development", count: 24 },
  { name: "Cloud Computing", count: 20 },
  { name: "Cyber Security", count: 18 },
  { name: "Python Programming", count: 35 },
  { name: "Design", count: 22 }
];

export default function Home() {
  const [featuredData, setFeaturedData] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [featured, cats] = await Promise.all([
        getFeaturedCourses().catch(() => null),
        getCategories().catch(() => [])
      ]);
      if (featured) setFeaturedData(featured);
      if (cats && cats.length > 0) setCategories(cats);
    } catch (error) {
      console.log("Using default data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatDuration = (mins) => {
    if (!mins) return "0m";
    const hours = Math.floor(mins / 60);
    return hours > 0 ? `${hours}h` : `${mins}m`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  };

  const CourseCard = ({ course }) => (
    <Link to={`/courses/${course._id}`} className="course-card-home">
      <div className="course-thumbnail">
        <img 
          src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400"} 
          alt={course.title}
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400" }}
        />
        {course.isBestseller && <span className="badge-bestseller">Bestseller</span>}
        {course.isFree && <span className="badge-free">Free</span>}
      </div>
      <div className="course-info">
        <h3 className="course-title">{course.title}</h3>
        <p className="course-instructor">{course.instructorName || "Expert Instructor"}</p>
        <div className="course-rating">
          <span className="rating-value">{(course.rating || 4.5).toFixed(1)}</span>
          <span className="stars">{renderStars(course.rating || 4.5)}</span>
          <span className="rating-count">({course.totalRatings || 0})</span>
        </div>
        <div className="course-meta">
          <span>{course.totalLessons || 0} lessons</span>
          <span>•</span>
          <span>{formatDuration(course.totalDuration)}</span>
          <span>•</span>
          <span>{course.level || "Beginner"}</span>
        </div>
        <div className="course-price">
          {course.isFree || course.price === 0 ? (
            <span className="price-free">Free</span>
          ) : (
            <>
              <span className="price-current">${course.price || 0}</span>
              {course.originalPrice > course.price && (
                <span className="price-original">${course.originalPrice}</span>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  );

  const goToRoleLogin = (role) => {
    navigate(`/login?role=${role}`);
  };

  if (loading) return <Loader />;

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-bg-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">🎯 #1 Learning Platform</div>
            <h1>
              Unlock Your Potential with <span className="gradient-text">World-Class</span> Courses
            </h1>
            <p>
              Join millions of learners worldwide. Master in-demand skills with expert-led courses, 
              hands-on projects, and personalized learning paths.
            </p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="What do you want to learn today?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </form>
            <div className="hero-tags">
              <span>Popular:</span>
              <Link to="/courses?category=Web Development">Web Development</Link>
              <Link to="/courses?category=Data Science">Data Science</Link>
              <Link to="/courses?category=AI / Machine Learning">Machine Learning</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrapper">
              <img 
                src="https://cdni.iconscout.com/illustration/premium/thumb/online-learning-illustration-download-in-svg-png-gif-file-formats--digital-education-teaching-web-hosting-pack-education-illustrations-5825441.png" 
                alt="Learning"
              />
              <div className="floating-card card-1">
                <span className="icon">🎓</span>
                <div>
                  <strong>50K+</strong>
                  <span>Active Learners</span>
                </div>
              </div>
              <div className="floating-card card-2">
                <span className="icon">⭐</span>
                <div>
                  <strong>4.9/5</strong>
                  <span>Average Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, idx) => (
              <div key={idx} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header">
            <h2>Explore Top Categories</h2>
            <p>Browse our most popular categories and start learning something new today</p>
          </div>
          <div className="categories-grid">
            {categories.slice(0, 8).map((cat, idx) => (
              <Link 
                key={idx} 
                to={`/courses?category=${cat.name}`} 
                className="category-item"
              >
                <span className="category-icon">{CATEGORY_ICONS[cat.name] || "📚"}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{cat.count} courses</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Portals */}
      <section className="role-section">
        <div className="container">
          <div className="section-header center">
            <h2>Choose Your Learning Path</h2>
            <p>Access personalized dashboards based on your role</p>
          </div>
          <div className="role-grid">
            <div className="role-card role-student">
              <div className="role-icon">🎓</div>
              <h3>Student</h3>
              <p>Access courses, attempt quizzes, and track your learning progress.</p>
              <button className="role-btn" onClick={() => goToRoleLogin("student")}>
                Login as Student
              </button>
            </div>
            <div className="role-card role-teacher">
              <div className="role-icon">👩‍🏫</div>
              <h3>Teacher</h3>
              <p>Manage course content, create quizzes, and view student analytics.</p>
              <button className="role-btn secondary" onClick={() => goToRoleLogin("teacher")}>
                Login as Teacher
              </button>
            </div>
            <div className="role-card role-admin">
              <div className="role-icon">🛡️</div>
              <h3>Admin</h3>
              <p>Control users, courses, and overall platform configuration.</p>
              <button className="role-btn secondary" onClick={() => goToRoleLogin("admin")}>
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredData?.featured?.length > 0 && (
        <section className="courses-section">
          <div className="container">
            <div className="section-header">
              <div>
                <h2>⭐ Featured Courses</h2>
                <p>Hand-picked courses by our experts</p>
              </div>
              <Link to="/courses" className="view-all-btn">
                View All <span>→</span>
              </Link>
            </div>
            <div className="courses-grid">
              {featuredData.featured.slice(0, 4).map(course => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Courses */}
      {featuredData?.popular?.length > 0 && (
        <section className="courses-section bg-light">
          <div className="container">
            <div className="section-header">
              <div>
                <h2>🔥 Most Popular</h2>
                <p>Courses loved by thousands of learners</p>
              </div>
              <Link to="/courses?sortBy=popular" className="view-all-btn">
                View All <span>→</span>
              </Link>
            </div>
            <div className="courses-grid">
              {featuredData.popular.slice(0, 4).map(course => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="features-section">
        <div className="container">
          <div className="section-header center">
            <h2>Why Learn with SmartEdu?</h2>
            <p>Everything you need to succeed in your learning journey</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Personalized Learning</h3>
              <p>AI-powered recommendations tailored to your goals and learning style</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Expert Instructors</h3>
              <p>Learn from industry professionals with real-world experience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Learn Anywhere</h3>
              <p>Access courses on any device, anytime, at your own pace</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Earn Certificates</h3>
              <p>Get recognized credentials to showcase your new skills</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Community Support</h3>
              <p>Connect with fellow learners and get help when you need it</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor your learning journey with detailed analytics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header center">
            <h2>What Our Learners Say</h2>
            <p>Join thousands of satisfied students who transformed their careers</p>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="testimonial-card">
                <div className="testimonial-content">
                  <div className="quote-icon">"</div>
                  <p>{t.text}</p>
                </div>
                <div className="testimonial-author">
                  <img src={t.avatar} alt={t.name} />
                  <div>
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  {"★".repeat(t.rating)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Learning?</h2>
            <p>Join millions of learners and take the first step towards your goals</p>
            <div className="cta-buttons">
              {user ? (
                <Link to="/courses" className="btn-cta primary">Browse Courses</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-cta primary">Get Started Free</Link>
                  <Link to="/courses" className="btn-cta secondary">Explore Courses</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-mark">SE</span>
                <span className="logo-text">SmartEdu</span>
              </div>
              <p>Empowering learners worldwide with quality education and expert guidance.</p>
            </div>
            <div className="footer-links">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div className="footer-links">
              <h4>Resources</h4>
              <a href="#">Help Center</a>
              <a href="#">Community</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-links">
              <h4>Legal</h4>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 SmartEdu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
