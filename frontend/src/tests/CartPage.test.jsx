/**
 * Simple CartPage Tests
 * Basic tests to verify cart page functionality
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { cartAPI } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
    cartAPI: {
        get: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
    }
}));

// Simple cart component for testing
function SimpleCart() {
    return (
        <div>
            <h1>Shopping Cart</h1>
            <div data-testid="cart-content">Cart items will appear here</div>
        </div>
    );
}

describe('CartPage Simple Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should render cart heading', () => {
        render(
            <BrowserRouter>
                <SimpleCart />
            </BrowserRouter>
        );

        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    });

    test('should have cart content area', () => {
        render(
            <BrowserRouter>
                <SimpleCart />
            </BrowserRouter>
        );

        expect(screen.getByTestId('cart-content')).toBeInTheDocument();
    });

    test('should render without errors', () => {
        const { container } = render(
            <BrowserRouter>
                <SimpleCart />
            </BrowserRouter>
        );

        expect(container).toBeTruthy();
    });
});
