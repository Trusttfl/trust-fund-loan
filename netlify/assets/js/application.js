document.addEventListener('DOMContentLoaded', () => {
  // Loan Calculator
  const calcAmount = document.getElementById('calcAmount');
  const amountValue = document.getElementById('amountValue');
  const calcTerm = document.getElementById('calcTerm');
  const estimatedPayment = document.getElementById('estimatedPayment');

  calcAmount.addEventListener('input', updateCalculator);
  calcTerm.addEventListener('change', updateCalculator);

  function updateCalculator() {
    const amount = parseInt(calcAmount.value);
    const term = parseInt(calcTerm.value);
    const interestRate = 0.08; // 8% annual
    
    amountValue.textContent = `$${amount.toLocaleString()}`;
    
    // Simple interest calculation
    const monthlyPayment = (amount * (1 + interestRate)) / term;
    estimatedPayment.textContent = `$${monthlyPayment.toFixed(2)}`;
  }

  // OTP Verification
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const otpCode = document.getElementById('otpCode');
  let otpVerified = false;

  sendOtpBtn.addEventListener('click', async () => {
    const phone = document.getElementById('phone').value;
    if (!phone) {
      alert('Please enter phone number first');
      return;
    }

    try {
      const response = await fetch('https://your-cyclic-app.cyclic.app/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      if (response.ok) {
        otpCode.disabled = false;
        alert('OTP sent to your phone!');
      }
    } catch (error) {
      console.error('OTP Error:', error);
    }
  });

  // File Upload Previews
  const idDocument = document.getElementById('idDocument');
  const idPreview = document.getElementById('idPreview');
  const incomeDocument = document.getElementById('proofOfIncome');
  const incomePreview = document.getElementById('incomePreview');

  idDocument.addEventListener('change', (e) => previewFile(e, idPreview));
  incomeDocument.addEventListener('change', (e) => previewFile(e, incomePreview));

  function previewFile(event, previewElement) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (file.type.startsWith('image/')) {
        previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px;">`;
      } else {
        previewElement.textContent = `File: ${file.name}`;
      }
    };
    reader.readAsDataURL(file);
  }

  // Form Submission
  const loanForm = document.getElementById('loanForm');
  const formResult = document.getElementById('formResult');

  loanForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Verify OTP first
    const otp = otpCode.value;
    const phone = document.getElementById('phone').value;
    
    if (!otpVerified && otp) {
      const otpResponse = await fetch('https://your-cyclic-app.cyclic.app/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      
      const otpData = await otpResponse.json();
      if (!otpData.valid) {
        formResult.textContent = 'Invalid OTP code';
        formResult.className = 'result-message error';
        formResult.style.display = 'block';
        return;
      }
      otpVerified = true;
    }

    // Upload documents
    const formData = new FormData();
    formData.append('idDocument', idDocument.files[0]);
    if (incomeDocument.files[0]) {
      formData.append('proofOfIncome', incomeDocument.files[0]);
    }

    try {
      // Upload files first
      const uploadResponse = await fetch('https://your-cyclic-app.cyclic.app/api/upload', {
        method: 'POST',
        body: formData
      });
      const fileUrls = await uploadResponse.json();

      // Submit application data
      const applicationData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: phone,
        currency: document.getElementById('currency').value,
        amount: parseFloat(document.getElementById('amount').value),
        term: parseInt(document.getElementById('term').value),
        purpose: document.getElementById('purpose').value,
        documents: fileUrls
      };

      const response = await fetch('https://your-cyclic-app.cyclic.app/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        formResult.textContent = 'Application submitted successfully! Check your email for confirmation.';
        formResult.className = 'result-message success';
        loanForm.reset();
        idPreview.innerHTML = '';
        incomePreview.innerHTML = '';
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      formResult.textContent = 'Error submitting application. Please try again.';
      formResult.className = 'result-message error';
      console.error('Submission Error:', error);
    } finally {
      formResult.style.display = 'block';
    }
  });

  // Initialize calculator
  updateCalculator();
});