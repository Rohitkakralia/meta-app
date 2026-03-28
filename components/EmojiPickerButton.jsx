import { useState, useRef, useEffect } from "react";

const EmojiPickerButton = ({ onEmojiSelect, theme = "light" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);

  // Emoji categories with simple emojis
  const emojiCategories = {
    "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳"],
    "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"],
    "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
    "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥"],
    "Food": ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅"],
    "Objects": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊"]
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Open emoji picker"
        className={`p-1.5 rounded-full transition-colors ${
          theme === "dark" 
            ? "hover:bg-gray-600 text-gray-300" 
            : "hover:bg-gray-100 text-gray-600"
        }`}
      >
        😊
      </button>

      {/* Emoji Picker Popup */}
      {isOpen && (
        <div
          ref={pickerRef}
          className={`absolute bottom-12 left-0 z-50 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg border ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="p-3">
            <div className="text-xs font-medium mb-3 text-gray-500">
              Click an emoji to add it
            </div>
            
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} className="mb-4">
                <div className={`text-xs font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>
                  {category}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, index) => (
                    <button
                      key={`${category}-${index}`}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`text-xl p-2 rounded hover:scale-110 transition-transform ${
                        theme === "dark" 
                          ? "hover:bg-gray-700" 
                          : "hover:bg-gray-100"
                      }`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPickerButton;