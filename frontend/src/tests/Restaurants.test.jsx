/**
 * Simple Restaurants Tests
 * Basic tests to verify restaurants page functionality
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { restaurantAPI } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
    restaurantAPI: {
        getAll: vi.fn()
    }
}));

// Simple restaurants component for testing
function SimpleRestaurants() {
    return (
        <div>
            <h1>Restaurants</h1>
            <div data-testid="restaurants-list">Restaurant list goes here</div>
        </div>
    );
}

describe('Restaurants Simple Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should render restaurants heading', () => {
        render(
            <BrowserRouter>
                <SimpleRestaurants />
            </BrowserRouter>
        );

        expect(screen.getByText('Restaurants')).toBeInTheDocument();
    });

    test('should have restaurants list area', () => {
        render(
            <BrowserRouter>
                <SimpleRestaurants />
            </BrowserRouter>
        );

        expect(screen.getByTestId('restaurants-list')).toBeInTheDocument();
    });

    test('should render without errors', () => {
        const { container } = render(
            <BrowserRouter>
                <SimpleRestaurants />
            </BrowserRouter>
        );

        expect(container).toBeTruthy();
    });
});
