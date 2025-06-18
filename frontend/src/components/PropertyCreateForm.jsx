import React, { useState, useEffect } from 'react';

function PropertyCreateForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    address: '',
    postcode: '',
    property_type: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    tenure: '',
    buyer_id: '',
    seller_id: '',
    buyer_solicitor_id: '',
    seller_solicitor_id: '',
  });
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [solicitors, setSolicitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    async function fetchUsers() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [buyersRes, sellersRes, solicitorsRes] = await Promise.all([
          fetch('http://localhost:8000/users?role=buyer', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:8000/users?role=seller', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('http://localhost:8000/users?role=solicitor', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        setBuyers(buyersRes.ok ? await buyersRes.json() : []);
        setSellers(sellersRes.ok ? await sellersRes.json() : []);
        setSolicitors(solicitorsRes.ok ? await solicitorsRes.json() : []);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    delete payload.status;
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add New Property</h2>
        <form onSubmit={handleSubmit}>
          <label>Address:<input name="address" value={form.address} onChange={handleChange} required /></label>
          <label>Postcode:<input name="postcode" value={form.postcode} onChange={handleChange} required /></label>
          <label>Price:<input name="price" type="number" value={form.price} onChange={handleChange} required /></label>
          <label>Type:<input name="property_type" value={form.property_type} onChange={handleChange} /></label>
          <label>Bedrooms:<input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} /></label>
          <label>Bathrooms:<input name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} /></label>
          <label>Tenure:<input name="tenure" value={form.tenure} onChange={handleChange} /></label>
          <label>Buyer:
            <select name="buyer_id" value={form.buyer_id} onChange={handleChange} required>
              <option value="">Select Buyer</option>
              {buyers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}
            </select>
          </label>
          <label>Seller:
            <select name="seller_id" value={form.seller_id} onChange={handleChange} required>
              <option value="">Select Seller</option>
              {sellers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}
            </select>
          </label>
          <label>Buyer's Solicitor:
            <select name="buyer_solicitor_id" value={form.buyer_solicitor_id} onChange={handleChange} required>
              <option value="">Select Solicitor</option>
              {solicitors.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}
            </select>
          </label>
          <label>Seller's Solicitor:
            <select name="seller_solicitor_id" value={form.seller_solicitor_id} onChange={handleChange} required>
              <option value="">Select Solicitor</option>
              {solicitors.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>)}
            </select>
          </label>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button type="submit" className="save-btn" disabled={loading}>Create Property</button>
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PropertyCreateForm; 