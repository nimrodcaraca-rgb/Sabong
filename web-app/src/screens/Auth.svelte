<script lang="ts">
  import { ArrowRight, Bird, LockKeyhole, Mail, ShieldCheck } from '@lucide/svelte'
  let { onEnter }: { onEnter: (farm?: string) => void } = $props()
  let mode = $state<'login' | 'register' | 'recover'>('login')
  let email = $state('')
  let password = $state('')
  let farm = $state('')
  let error = $state('')
  let message = $state('')
  function submit(event: SubmitEvent) {
    event.preventDefault()
    error = ''
    message = ''
    if (!email.includes('@')) { error = 'Enter a valid email address.'; return }
    if (mode === 'recover') { message = 'This is a UI demo. No recovery email was sent.'; return }
    if (password.length < 6) { error = 'Enter a password with at least 6 characters.'; return }
    if (mode === 'register' && !farm.trim()) { error = 'Enter your farm name.'; return }
    onEnter(mode === 'register' ? farm.trim() : undefined)
  }
  function switchMode(next: 'login' | 'register' | 'recover') { mode = next; error = ''; message = '' }
</script>
<div class="auth-layout">
  <div class="auth-story"><div class="auth-brand"><span class="brand-mark"><img src="/sabong-mark.png" alt="" /></span><strong>SABONG</strong></div><div class="auth-story-content"><span class="auth-line"></span><h1>Every bird has a story. Keep it all together.</h1><p>Profiles, pedigree, care, inventory, and matches in one clear view of your stable.</p><div class="auth-feature-row"><span><Bird size={19} /> Bird records</span><span><ShieldCheck size={19} /> Care schedules</span></div></div><small>Gamefowl management and record system</small></div>
  <main class="auth-panel"><div class="auth-mobile-brand"><span class="brand-mark"><img src="/sabong-mark.png" alt="" /></span><strong>SABONG</strong></div><div class="auth-card"><p class="kicker">San Isidro demo</p><h2>{mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your farm' : 'Reset your password'}</h2><p>{mode === 'login' ? 'Sign in to manage your stable.' : mode === 'register' ? 'Set up a space for your birds and records.' : 'Enter your email to start recovery.'}</p>
    <form onsubmit={submit} novalidate>
      {#if mode === 'register'}<label class="field"><span>Farm name</span><input bind:value={farm} placeholder="e.g. San Isidro Farm" autocomplete="organization" required /></label>{/if}
      <label class="field"><span>Email address</span><span class="input-icon"><Mail size={18} /><input bind:value={email} type="email" placeholder="you@farm.com" autocomplete="email" required /></span></label>
      {#if mode !== 'recover'}<label class="field"><span>Password</span><span class="input-icon"><LockKeyhole size={18} /><input bind:value={password} type="password" placeholder="At least 6 characters" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} required /></span></label>{/if}
      {#if error}<p class="form-error" role="alert">{error}</p>{/if}{#if message}<p class="form-message" role="status">{message}</p>{/if}
      {#if mode === 'login'}<button type="button" class="auth-link" onclick={() => switchMode('recover')}>Forgot password?</button>{/if}
      <button class="primary-button auth-submit" type="submit">{mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create farm' : 'Continue'} <ArrowRight size={17} /></button>
    </form>
    {#if mode === 'login'}<p class="auth-switch">New to Sabong? <button onclick={() => switchMode('register')}>Create an account</button></p>{:else}<p class="auth-switch"><button onclick={() => switchMode('login')}>Back to sign in</button></p>{/if}
    <div class="demo-divider"><span>or</span></div><button class="demo-button" onclick={() => onEnter()}>Explore the UI demo <ArrowRight size={17} /></button><p class="demo-note">Demo screens use sample records. Sign in and recovery do not contact a server.</p>
  </div></main>
</div>
