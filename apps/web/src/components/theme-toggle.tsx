import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { type UserTheme, useTheme } from "../components/theme-provider";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { setTheme, appTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: UserTheme = appTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [appTheme, setTheme]);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`group/toggle relative size-8 overflow-hidden ${className}`}
        title="Toggle theme"
      />
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={`group/toggle relative size-8 overflow-hidden ${className}`}
      onClick={toggleTheme}
      title="Toggle theme"
    >
      {appTheme === "dark" ? (
        <motion.span
          key="moon"
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1.05,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute h-4 w-4"
        >
          <Moon />
        </motion.span>
      ) : (
        <motion.span
          key="sun"
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1.05,
          }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute h-4 w-4"
        >
          <Sun />
        </motion.span>
      )}
      <Label className="sr-only">Toggle theme</Label>
    </Button>
  );
}
