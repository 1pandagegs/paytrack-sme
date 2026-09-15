document.addEventListener('DOMContentLoaded', () => {
  const client = window.paytrackSupabase;
  const form = document.getElementById('signupForm');
  const errorBox = document.getElementById('signupError');
  const successBox = document.getElementById('signupSuccess');
  const submitButton = document.getElementById('signupSubmitButton');
  const colour = document.getElementById('signupBrandColor');
  const hex = document.getElementById('signupBrandHex');
  const mark = document.getElementById('signupLogoMark');
  const logoInput = document.getElementById('signupLogoUpload');
  let organisation_logo_data_url = '';

  const setColour = value => {
    if (!/^#[0-9a-fA-F]{6}$/.test(value || '')) return;
    colour.value = value;
    hex.value = value;
    mark.style.background = value;
    document.documentElement.style.setProperty('--primary', value);
  };


  const fileToLogoDataUrl = file => new Promise((resolve,reject)=>{
    if(!file){resolve('');return;} if(file.size>2*1024*1024){reject(new Error('Logo must be smaller than 2 MB.'));return;}
    const reader=new FileReader(); reader.onerror=()=>reject(new Error('Unable to read logo.')); reader.onload=()=>{
      if(file.type==='image/svg+xml'){resolve(reader.result);return;}
      const img=new Image(); img.onload=()=>{const max=420,scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/webp',0.82));};img.onerror=()=>reject(new Error('Unsupported logo image.'));img.src=reader.result;
    }; reader.readAsDataURL(file);
  });
  logoInput?.addEventListener('change',async e=>{try{organisation_logo_data_url=await fileToLogoDataUrl(e.target.files?.[0]);if(organisation_logo_data_url){mark.textContent='';const img=document.createElement('img');img.src=organisation_logo_data_url;img.alt='Organisation logo';img.style.cssText='width:100%;height:100%;object-fit:contain;background:#fff;padding:4px;box-sizing:border-box;border-radius:inherit';mark.appendChild(img);}}catch(err){errorBox.textContent=err.message;errorBox.hidden=false;e.target.value='';}});

  colour.addEventListener('input', e => setColour(e.target.value));
  hex.addEventListener('input', e => { if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) setColour(e.target.value); });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorBox.hidden = true;
    successBox.hidden = true;

    const full_name = document.getElementById('signupFullName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const workspace_name = document.getElementById('signupWorkspaceName').value.trim();
    const organisation_code = document.getElementById('signupOrganisationCode').value.trim().toUpperCase();
    const brand_color = hex.value.trim();

    if (password !== confirmPassword) {
      errorBox.textContent = 'Passwords do not match.';
      errorBox.hidden = false;
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(brand_color)) {
      errorBox.textContent = 'Enter a valid six-digit brand colour.';
      errorBox.hidden = false;
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, workspace_name, organisation_code, brand_color, organisation_logo_data_url }
      }
    });

    if (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
      return;
    }

    successBox.textContent = data.session
      ? 'Account created. Opening your workspace...'
      : 'Account created. Check your email to confirm your account, then sign in.';
    successBox.hidden = false;

    if (data.session) {
      setTimeout(() => window.location.replace('pages/dashboard.html'), 700);
    } else {
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
    }
  });
});
