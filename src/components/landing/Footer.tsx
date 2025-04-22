
export const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-purple-500/20">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h2 className="text-2xl font-bold neon-text mb-4 md:mb-0">CopyWhisper</h2>
          
          <div className="flex gap-6">
            <a href="#" className="text-purple-300 hover:text-white transition-colors">Features</a>
            <a href="#" className="text-purple-300 hover:text-white transition-colors">Pricing</a>
            <a href="#" className="text-purple-300 hover:text-white transition-colors">FAQ</a>
            <a href="#" className="text-purple-300 hover:text-white transition-colors">Support</a>
          </div>
        </div>
        
        <div className="border-t border-purple-500/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-purple-300 mb-4 md:mb-0">© 2025 CopyWhisper. All rights reserved.</p>
          
          <div className="flex gap-6">
            <a href="#" className="text-purple-300 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-purple-300 hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
