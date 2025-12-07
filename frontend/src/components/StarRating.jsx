import React from 'react';
import './StarRating.css';

/**
 * StarRating Component
 * Displays star ratings for restaurants and menu items
 * Can show full stars, half stars, and empty stars
 */
const StarRating = ({ rating = 0, reviewCount = 0, showCount = true, size = 'medium' }) => {
    // Ensure rating is between 0 and 5
    const normalizedRating = Math.min(Math.max(rating, 0), 5);

    // Calculate full stars, half stars, and empty stars
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Size classes for different star sizes
    const sizeClasses = {
        small: 'star-small',
        medium: 'star-medium',
        large: 'star-large'
    };

    const starClass = sizeClasses[size] || sizeClasses.medium;

    return (
        <div className="star-rating">
            <div className="stars">
                {/* Render full stars */}
                {[...Array(fullStars)].map((_, index) => (
                    <span key={`full-${index}`} className={`star ${starClass} star-full`}>
                        ★
                    </span>
                ))}

                {/* Render half star if needed */}
                {hasHalfStar && (
                    <span className={`star ${starClass} star-half`}>
                        ★
                    </span>
                )}

                {/* Render empty stars */}
                {[...Array(emptyStars)].map((_, index) => (
                    <span key={`empty-${index}`} className={`star ${starClass} star-empty`}>
                        ★
                    </span>
                ))}
            </div>

            {/* Display rating number and review count */}
            {showCount && (
                <span className="rating-info">
                    {normalizedRating > 0 ? (
                        <>
                            <span className="rating-value">{normalizedRating.toFixed(1)}</span>
                            {reviewCount > 0 && (
                                <span className="review-count">({reviewCount} reviews)</span>
                            )}
                        </>
                    ) : (
                        <span className="no-ratings">No ratings yet</span>
                    )}
                </span>
            )}
        </div>
    );
};

export default StarRating;
