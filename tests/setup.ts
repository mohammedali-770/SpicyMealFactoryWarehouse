import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Provide env so importing modules that read it (e.g. lib/supabase) does not throw.
vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-aaaaaaaaaaaaaaaaaaaaaaaa')
