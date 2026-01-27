/**
 * Animated Cursor Button Component
 * Shows an animated fake cursor that moves to a target button and "clicks" it
 * Used to highlight important features - Reusable component
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pointer } from 'lucide-react';

interface AnimatedCursorButtonProps {
  targetButtonRef: React.RefObject<HTMLButtonElement | HTMLElement>;
  onComplete?: () => void;
  delay?: number;
  showOnce?: boolean;
  repeatInterval?: number; // Time in ms before repeating (default: 8000ms)
  startPosition?: 'top' | 'middle' | 'bottom' | { x: number; y: number }; // Start position
  cursorColor?: string; // Cursor color (default: white)
  highlightColor?: string; // Button highlight glow color (default: gold)
}

export const AnimatedCursorButton: React.FC<AnimatedCursorButtonProps> = ({
  targetButtonRef,
  onComplete,
  delay = 2000,
  showOnce = true,
  repeatInterval = 8000,
  startPosition = 'middle',
  cursorColor = '#FFFFFF', // White cursor
  highlightColor = '#FFD700', // Gold highlight
}) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const rippleRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const repeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimatingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Check if button is at least partially visible in viewport
  const isButtonInViewport = useCallback((button: HTMLElement): boolean => {
    const rect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if button is at least partially visible
    return (
      rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth
    );
  }, []);

  // Calculate start position based on prop
  const getStartPosition = useCallback(
    (buttonCenterX: number, buttonCenterY: number) => {
      if (typeof startPosition === 'object') {
        return { x: startPosition.x, y: startPosition.y };
      }

      let startX: number;
      let startY: number;

      switch (startPosition) {
        case 'top':
          startX = buttonCenterX;
          startY = 100; // 100px from top
          break;
        case 'bottom':
          startX = buttonCenterX;
          startY = window.innerHeight - 100; // 100px from bottom
          break;
        case 'middle':
        default:
          startX = buttonCenterX;
          startY = window.innerHeight / 2; // Middle of screen
          break;
      }

      return { x: startX, y: startY };
    },
    [startPosition]
  );

  const runAnimation = useCallback(() => {
    if (isAnimatingRef.current) {
      return;
    }

    if (!targetButtonRef.current) {
      // Retry after a short delay if button ref is not ready
      setTimeout(() => {
        if (isMountedRef.current && targetButtonRef.current && !isAnimatingRef.current) {
          runAnimation();
        }
      }, 500);
      return;
    }

    // Ensure cursor is visible before starting animation
    setIsVisible(true);
    if (cursorRef.current) {
      cursorRef.current.style.opacity = '1';
      cursorRef.current.style.visibility = 'visible';
    }

    isAnimatingRef.current = true;
    const button = targetButtonRef.current;

    // Wait for button to be in DOM and visible
    let checkAttempts = 0;
    const maxAttempts = 100; // 10 seconds max wait

    const checkButton = () => {
      checkAttempts++;
      if (checkAttempts > maxAttempts) {
        console.warn('AnimatedCursorButton: Button not found after max attempts');
        isAnimatingRef.current = false;
        return;
      }

      if (!button || !button.offsetParent) {
        // Button not visible yet, try again
        setTimeout(checkButton, 100);
        return;
      }

      // Check if button is in viewport before starting animation
      if (!isButtonInViewport(button)) {
        // Button is not in viewport, don't start animation
        isAnimatingRef.current = false;
        setIsVisible(false);
        if (cursorRef.current) {
          cursorRef.current.style.opacity = '0';
          cursorRef.current.style.visibility = 'hidden';
        }
        // If showOnce is false, schedule retry after a delay
        if (!showOnce && isMountedRef.current) {
          repeatTimeoutRef.current = setTimeout(() => {
            if (
              isMountedRef.current &&
              targetButtonRef.current &&
              isButtonInViewport(targetButtonRef.current)
            ) {
              runAnimation();
            }
          }, 500);
        }
        return;
      }

      const buttonRect = button.getBoundingClientRect();
      // Target position: at the bottom border of the button (border-b)
      const targetX = buttonRect.left + buttonRect.width / 2; // Center horizontally
      const targetY = buttonRect.bottom; // At the bottom border

      // Get start position (using target position for calculation)
      const startPos = getStartPosition(targetX, targetY);
      // Store initial start position for animation
      const startX = startPos.x;
      const startY = startPos.y;

      if (!cursorRef.current) {
        isAnimatingRef.current = false;
        return;
      }

      // Make cursor visible and keep it visible
      setIsVisible(true);
      const cursor = cursorRef.current;

      // Set initial position - use visibility instead of display to prevent layout shifts
      cursor.style.left = `${startX}px`;
      cursor.style.top = `${startY}px`;
      cursor.style.opacity = '1';
      cursor.style.visibility = 'visible';

      // Animate to button
      const duration = 2000; // 2 seconds to reach button
      const startTime = Date.now();

      const animate = () => {
        // Check if button is still in viewport - if not, hide cursor and stop animation
        if (!isButtonInViewport(button)) {
          setIsVisible(false);
          if (cursorRef.current) {
            cursorRef.current.style.opacity = '0';
            cursorRef.current.style.visibility = 'hidden';
          }
          isAnimatingRef.current = false;
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          // Schedule retry when button comes back into view
          if (!showOnce && isMountedRef.current) {
            repeatTimeoutRef.current = setTimeout(() => {
              if (
                isMountedRef.current &&
                targetButtonRef.current &&
                isButtonInViewport(targetButtonRef.current)
              ) {
                runAnimation();
              }
            }, 500);
          }
          return;
        }

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        // Recalculate button position in case of scroll
        // Always get fresh position to handle scrolling
        const currentButtonRect = button.getBoundingClientRect();
        // Target position: at the bottom border
        const currentTargetX = currentButtonRect.left + currentButtonRect.width / 2;
        const currentTargetY = currentButtonRect.bottom; // At the bottom border

        // Calculate position smoothly - adjust for button movement during scroll
        const buttonMovedX = currentTargetX - targetX;
        const buttonMovedY = currentTargetY - targetY;

        // Adjust start position to account for button movement (scrolling)
        const adjustedStartX = startX + buttonMovedX;
        const adjustedStartY = startY + buttonMovedY;

        const currentX = adjustedStartX + (currentTargetX - adjustedStartX) * easeOut;
        const currentY = adjustedStartY + (currentTargetY - adjustedStartY) * easeOut;

        // Ensure cursor stays visible (only if button is in viewport)
        if (cursorRef.current) {
          cursorRef.current.style.opacity = '1';
          cursorRef.current.style.visibility = 'visible';
        }

        cursor.style.left = `${currentX}px`;
        cursor.style.top = `${currentY}px`;

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Reached button - show click animation
          setIsClicking(true);

          // Recalculate button position for ripple (in case of scroll)
          const finalButtonRect = button.getBoundingClientRect();
          // Ripple position: at the bottom border (same as click target)
          const finalTargetX = finalButtonRect.left + finalButtonRect.width / 2;
          const finalTargetY = finalButtonRect.bottom; // At the bottom border

          // Show ripple effect
          if (rippleRef.current) {
            rippleRef.current.style.left = `${finalTargetX}px`;
            rippleRef.current.style.top = `${finalTargetY}px`;
            rippleRef.current.style.opacity = '1';
            rippleRef.current.style.transform = 'scale(0)';
            setTimeout(() => {
              if (rippleRef.current) {
                rippleRef.current.style.transform = 'scale(3)';
                rippleRef.current.style.opacity = '0';
              }
            }, 10);
          }

          // Add dramatic highlight effect to the button
          const originalTransform = button.style.transform;
          const originalBoxShadow = button.style.boxShadow;
          const originalTransition = button.style.transition;

          button.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
          button.style.transform = 'scale(1.15)';
          button.style.boxShadow = `0 0 40px ${highlightColor}CC, 0 0 80px ${highlightColor}99`;
          button.style.zIndex = '10';

          // Hold click for a moment
          setTimeout(() => {
            setIsClicking(false);
            // Remove button highlight
            setTimeout(() => {
              button.style.transform = originalTransform || 'scale(1)';
              button.style.boxShadow = originalBoxShadow || '';
              button.style.transition = originalTransition || '';
              button.style.zIndex = '';
            }, 400);

            // Instead of fading out, immediately restart animation from start position
            // Keep cursor visible and move it back to start, then repeat
            setTimeout(() => {
              // Recalculate start position based on current button position
              const resetButtonRect = button.getBoundingClientRect();
              const resetTargetX = resetButtonRect.left + resetButtonRect.width / 2;
              const resetTargetY = resetButtonRect.bottom;
              const resetStartPos = getStartPosition(resetTargetX, resetTargetY);

              // Smoothly move cursor back to start position
              cursor.style.transition = 'left 0.3s ease, top 0.3s ease';
              cursor.style.left = `${resetStartPos.x}px`;
              cursor.style.top = `${resetStartPos.y}px`;

              // Remove transition after movement
              setTimeout(() => {
                cursor.style.transition = '';
              }, 300);

              // Reset animation state but keep cursor visible
              isAnimatingRef.current = false;
              animationFrameRef.current = null;
              onComplete?.();

              // If showOnce is false, schedule next animation immediately
              if (!showOnce && isMountedRef.current) {
                // Small delay before restarting to make it smooth
                repeatTimeoutRef.current = setTimeout(() => {
                  if (!isMountedRef.current) return;
                  // Check if button is still in viewport before restarting
                  if (targetButtonRef.current && isButtonInViewport(targetButtonRef.current)) {
                    runAnimation();
                  } else {
                    // Button not in viewport, hide cursor and try again later
                    setIsVisible(false);
                    if (cursorRef.current) {
                      cursorRef.current.style.opacity = '0';
                      cursorRef.current.style.visibility = 'hidden';
                    }
                    repeatTimeoutRef.current = setTimeout(() => {
                      if (
                        isMountedRef.current &&
                        targetButtonRef.current &&
                        isButtonInViewport(targetButtonRef.current)
                      ) {
                        runAnimation();
                      }
                    }, 500);
                  }
                }, 500); // Small delay before restart
              } else {
                // If showOnce is true, hide cursor after animation
                setIsVisible(false);
                cursor.style.opacity = '0';
                cursor.style.visibility = 'hidden';
              }
            }, 200);
          }, 400);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    checkButton();
  }, [
    targetButtonRef,
    showOnce,
    onComplete,
    getStartPosition,
    highlightColor,
    isButtonInViewport,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    // Check if already shown (using localStorage if showOnce is true)
    if (showOnce) {
      const shown = localStorage.getItem('animatedCursorButtonShown');
      if (shown === 'true') {
        return;
      }
    } else {
      // If showOnce is false, clear the localStorage flag to allow continuous showing
      localStorage.removeItem('animatedCursorButtonShown');
    }

    // Start animation after initial delay
    animationTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        runAnimation();
      }
    }, delay);

    return () => {
      isMountedRef.current = false;
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (repeatTimeoutRef.current) {
        clearTimeout(repeatTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [delay, showOnce, runAnimation]);

  // Mark as shown in localStorage when animation completes (if showOnce is true)
  useEffect(() => {
    if (showOnce && isVisible) {
      const timer = setTimeout(() => {
        localStorage.setItem('animatedCursorButtonShown', 'true');
      }, 5000); // Mark as shown after animation completes
      return () => clearTimeout(timer);
    }
  }, [showOnce, isVisible]);

  // Check viewport on scroll/resize and restart animation if button comes into view
  useEffect(() => {
    const checkViewportAndAnimate = () => {
      if (!targetButtonRef.current || isAnimatingRef.current) return;

      // If button is in viewport and not animating, start animation
      if (isButtonInViewport(targetButtonRef.current)) {
        if (!isVisible && !showOnce) {
          runAnimation();
        }
      } else {
        // Button is out of viewport, hide cursor
        setIsVisible(false);
        if (cursorRef.current) {
          cursorRef.current.style.opacity = '0';
          cursorRef.current.style.visibility = 'hidden';
        }
      }
    };

    // Use passive listeners for better performance
    window.addEventListener('scroll', checkViewportAndAnimate, { passive: true, capture: true });
    window.addEventListener('resize', checkViewportAndAnimate, { passive: true });
    window.addEventListener('wheel', checkViewportAndAnimate, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkViewportAndAnimate, { capture: true });
      window.removeEventListener('resize', checkViewportAndAnimate);
      window.removeEventListener('wheel', checkViewportAndAnimate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, showOnce, runAnimation, isButtonInViewport]);

  // Always render cursor element - control visibility via styles only
  return (
    <>
      {/* Animated Cursor - Continuously visible */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9999]"
        style={{
          opacity: isVisible ? 1 : 0,
          visibility: isVisible ? 'visible' : 'hidden',
          transform: 'translate(-50%, -50%)',
          transition: 'opacity 0.2s ease, visibility 0.2s ease',
          willChange: 'transform, opacity',
        }}
      >
        <div className="relative">
          {/* Cursor pointer - Customizable color */}
          <Pointer
            className={`h-8 w-8 transition-transform duration-150 ${
              isClicking ? 'scale-75' : 'scale-100'
            }`}
            style={{
              color: cursorColor,
              filter: `drop-shadow(0 0 8px ${cursorColor}99) drop-shadow(0 0 16px ${cursorColor}66) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))`,
            }}
          />
          {/* Click effect ring */}
          {isClicking && (
            <>
              <div
                className="absolute inset-0 rounded-full border-3 animate-ping"
                style={{
                  borderWidth: '3px',
                  borderColor: cursorColor,
                  animation: 'ping 0.6s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{ backgroundColor: `${cursorColor}30` }}
              />
            </>
          )}
        </div>
      </div>

      {/* Ripple effect on click */}
      <div
        ref={rippleRef}
        className="fixed pointer-events-none z-[9998] rounded-full border-3"
        style={{
          width: '80px',
          height: '80px',
          opacity: 0,
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          borderColor: cursorColor,
          borderWidth: '3px',
          backgroundColor: `${cursorColor}30`,
        }}
      />
    </>
  );
};
