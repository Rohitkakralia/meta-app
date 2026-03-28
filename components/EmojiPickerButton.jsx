import { useState, useRef, useEffect } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
 
const EmojiPickerButton = ({ onEmojiSelect, theme = "light" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
 
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
    onEmojiSelect(emoji.native); // passes the emoji character e.g. "😀"
    setIsOpen(false);
  };
 
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Open emoji picker"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "50%",
          fontSize: "22px",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = theme === "dark" ? "#374151" : "#f0f0f0")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        😊
      </button>
 
      {/* Emoji Picker Popup */}
      {isOpen && (
        <div
          ref={pickerRef}
          style={{
            position: "absolute",
            bottom: "44px",
            left: "0",
            zIndex: 1000,
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme={theme}          // "light" | "dark" | "auto"
            set="native"           // uses system emojis
            showPreview={true}
            showSkinTones={true}
            emojiSize={22}
            emojiButtonSize={36}
            perLine={8}
            maxFrequentRows={2}
            categories={[
              "frequent",
              "people",
              "nature",
              "foods",
              "activity",
              "places",
              "objects",
              "symbols",
              "flags",
            ]}
            locale="en"
          />
        </div>
      )}
    </div>
  );
};
 
export default EmojiPickerButton;