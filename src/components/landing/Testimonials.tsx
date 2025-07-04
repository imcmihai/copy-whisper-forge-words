
export const Testimonials = () => {
  const testimonials = [
    {
      quote: "CopyWhisper has revolutionized our content strategy. We've seen a 43% increase in conversion rates since implementing the copy generated by this tool.",
      author: "Sarah Johnson",
      role: "Marketing Director"
    },
    {
      quote: "The SEO optimization is incredible. Our blog posts are ranking higher than ever, and the time saved is allowing us to focus on strategy rather than writing.",
      author: "Michael Chen",
      role: "SEO Specialist"
    },
    {
      quote: "As a small business owner, I don't have time to write perfect copy. CopyWhisper gives me professional-quality content in minutes instead of hours.",
      author: "Jessica Williams",
      role: "Ecommerce Owner"
    }
  ];

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trusted by <span className="neon-text">Marketing Professionals</span>
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            See why thousands of marketers rely on CopyWhisper for their content creation needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="glassmorphism p-8 rounded-2xl border border-purple-500/20">
              <div className="mb-6 text-[#00FFCC]">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.33333 18.6667C9.33333 16.4667 11.1333 14.6667 13.3333 14.6667V10.6667C8.93333 10.6667 5.33333 14.2667 5.33333 18.6667V26.6667H13.3333V18.6667H9.33333ZM23.3333 14.6667V10.6667C18.9333 10.6667 15.3333 14.2667 15.3333 18.6667V26.6667H23.3333V18.6667H19.3333C19.3333 16.4667 21.1333 14.6667 23.3333 14.6667Z" fill="currentColor"/>
                </svg>
              </div>
              <p className="text-purple-200 mb-6">{testimonial.quote}</p>
              <div>
                <p className="font-bold">{testimonial.author}</p>
                <p className="text-purple-300 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
