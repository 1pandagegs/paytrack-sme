document.addEventListener('DOMContentLoaded', () => {
  const client = window.paytrackSupabase;
  const form = document.getElementById('signupForm');
  const errorBox = document.getElementById('signupError');
  const successBox = document.getElementById('signupSuccess');
  const submitButton = document.getElementById('signupSubmitButton');

  form.addEventListener('submit', async event => {
    event.preventDefault(); errorBox.hidden=true; successBox.hidden=true;
    const full_name=document.getElementById('signupFullName').value.trim();
    const email=document.getElementById('signupEmail').value.trim();
    const password=document.getElementById('signupPassword').value;
    const confirmPassword=document.getElementById('signupConfirmPassword').value;
    const organisation_code=document.getElementById('signupOrganisation').value;
    const names={AS5:'AS5 Group',SABALI:'Sabali Limited'};
    if(password!==confirmPassword){errorBox.textContent='Passwords do not match.';errorBox.hidden=false;return;}
    if(!names[organisation_code]){errorBox.textContent='Select AS5 Group or Sabali Limited.';errorBox.hidden=false;return;}
    submitButton.disabled=true;submitButton.textContent='Creating account...';
    const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name,organisation_code,workspace_name:names[organisation_code]}}});
    if(error){errorBox.textContent=error.message;errorBox.hidden=false;submitButton.disabled=false;submitButton.textContent='Create Account';return;}
    successBox.textContent=data.session?'Account created and linked to '+names[organisation_code]+'. Opening your workspace...':'Account created and linked to '+names[organisation_code]+'. Confirm your email, then sign in.';
    successBox.hidden=false;
    if(data.session)setTimeout(()=>window.location.replace('pages/dashboard.html'),700);
    else{submitButton.disabled=false;submitButton.textContent='Create Account';}
  });
});
