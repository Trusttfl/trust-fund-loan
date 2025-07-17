document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const loanContainer = document.getElementById('loanContainer');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('searchInput');
  const rejectModal = document.getElementById('rejectModal');
  
  // Fetch all loans
  async function fetchLoans() {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://your-cyclic-app.cyclic.app/api/admin/loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch loans');
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  // Render loans
  function renderLoans(loans) {
    loanContainer.innerHTML = '';
    
    loans.forEach(loan => {
      const loanCard = document.createElement('div');
      loanCard.className = 'loan-card';
      loanCard.innerHTML = `
        <h3>${loan.fullName} <small>${loan._id}</small></h3>
        <p>Amount: ${loan.amount} ${loan.currency} | Term: ${loan.term} months</p>
        <p>Status: <span class="loan-status status-${loan.status}">${loan.status}</span></p>
        <p>Credit Score: <span class="credit-score credit-${loan.creditScoreStatus || 'low'}">
          ${loan.creditScore || 'N/A'}
        </span></p>
        ${loan.documents?.idDocument ? `
          <p>ID Document: <a href="${loan.documents.idDocument}" class="document-link" target="_blank">View</a></p>
        ` : ''}
        ${loan.rejectionReason ? `<p>Rejection Reason: ${loan.rejectionReason}</p>` : ''}
        
        <div class="action-buttons">
          ${loan.status !== 'approved' ? `
            <button class="approve-btn" data-id="${loan._id}">Approve</button>
          ` : ''}
          ${loan.status !== 'rejected' ? `
            <button class="reject-btn" data-id="${loan._id}">Reject</button>
          ` : ''}
        </div>
      `;
      loanContainer.appendChild(loanCard);
    });

    // Add event listeners
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', approveLoan);
    });
    
    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', openRejectModal);
    });
  }

  // Approve loan
  async function approveLoan(e) {
    const loanId = e.target.dataset.id;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://your-cyclic-app.cyclic.app/api/admin/loans/${loanId}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('Loan approved successfully!');
        loadAndRenderLoans();
      }
    } catch (error) {
      console.error('Approval error:', error);
    }
  }

  // Reject loan
  async function rejectLoan(loanId, reason) {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://your-cyclic-app.cyclic.app/api/admin/loans/${loanId}/reject`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        alert('Loan rejected successfully!');
        loadAndRenderLoans();
      }
    } catch (error) {
      console.error('Rejection error:', error);
    }
  }

  // Modal functions
  function openRejectModal(e) {
    document.getElementById('rejectLoanId').value = e.target.dataset.id;
    rejectModal.style.display = 'block';
  }

  function closeRejectModal() {
    rejectModal.style.display = 'none';
    document.getElementById('rejectionReason').value = '';
  }

  // Filter and search
  function filterLoans(loans, status, searchTerm) {
    return loans.filter(loan => {
      const statusMatch = status === 'all' || loan.status === status;
      const searchMatch = searchTerm === '' || 
        loan.fullName.toLowerCase().includes(searchTerm) || 
        loan._id.includes(searchTerm);
      return statusMatch && searchMatch;
    });
  }

  async function loadAndRenderLoans() {
    const loans = await fetchLoans();
    const filteredLoans = filterLoans(
      loans,
      statusFilter.value,
      searchInput.value.toLowerCase()
    );
    renderLoans(filteredLoans);
  }

  // Event listeners
  statusFilter.addEventListener('change', loadAndRenderLoans);
  searchInput.addEventListener('input', loadAndRenderLoans);
  document.getElementById('cancelRejectBtn').addEventListener('click', closeRejectModal);
  document.getElementById('confirmRejectBtn').addEventListener('click', () => {
    const loanId = document.getElementById('rejectLoanId').value;
    const reason = document.getElementById('rejectionReason').value;
    rejectLoan(loanId, reason);
    closeRejectModal();
  });

  // Initial load
  loadAndRenderLoans();
});