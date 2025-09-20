"use client";
import { AsclepiusIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export default function Page() {
  const [showCenter, setShowCenter] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCenter(false);
    }, 1000); // After 2 seconds, switch from center to top left

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <AnimatePresence>
        {!showCenter && (
          <motion.div
            layoutId="asclepius"
            transition={{
              duration: 1.2,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-0 p-4 text-secondary rounded-xl flex items-center justify-center"
          >
            <AsclepiusIcon size={24} />
          </motion.div>
        )}

        {showCenter && (
          <motion.div
            transition={{
              duration: 1.2,
              ease: "easeInOut",
            }}
            layoutId="asclepius"
          >
            <div className=" text-secondary rounded-xl flex items-center justify-center">
              <AsclepiusIcon size={48} />
            </div>
          </motion.div>
        )}

        {!showCenter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.2, ease: "easeInOut" }}
            className="text-center mb-4"
          >
            <h1 className="text-2xl font-semibold tracking-tight">
              Magic Link Sent
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Waiting for you to click the link sent to your email. Link expires
              in minutes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
