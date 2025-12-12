/**
 * Simple AuthContext Tests
 * Basic tests to verify authentication context functionality
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
    authAPI: {
        register: vi.fn(),
        login: vi.fn(),
        me: vi.fn()
    }
}));

// Simple test component
function TestComponent() {
    const { user, loading } = useAuth();

    return (
        <div>
            <div data-testid="user-name">{user ? user.name : 'No user'}</div>
            <div data-testid="loading">{loading ? 'Loading' : 'Ready'}</div>
        </div>
    );
}

describe('AuthContext Simple Tests', () => {

    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    test('should render without crashing', () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('user-name')).toBeInTheDocument();
    });

    test('should show no user initially', () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('user-name')).toHaveTextContent('No user');
    });

    test('should handle loading state', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
        });
    });
});
