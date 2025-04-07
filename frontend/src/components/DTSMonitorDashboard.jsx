//for trackermonitor userrole
import React, { useEffect, useState, useCallback } from 'react';
//import axios from 'axios';
import { Table, Spinner, Alert } from 'react-bootstrap';
import { fetchData } from "../utils/api";
import { getLoginName, getUserRole } from "../utils/authUtils";
import axios from "axios";
import { formatDate } from '../utils/date';
const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

function DTSMonitorDashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const userName = getLoginName(); //needed for audit trail
  const userRole = getUserRole();

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData(
        `${API_URL}/reports/summary`,
        token
      );
      //console.log(response.report);
      setReport(response.report || [])
      //console.log(response.trackers);
      //setTotalPages(response.metadata?.totalPages || 1)
    } catch (error) {
      setError("Failed to fetch trackers: " + error.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    /*     const fetchReport = async () => {
          try {
            //const token = localStorage.getItem('token'); // Assuming JWT is stored in localStorage
            const response = await axios.get('/reports/summary', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            setReport(response.data.report);
          } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch report');
          } finally {
            setLoading(false);
          }
        };
     */
    fetchReport();
  }, []);

  if (loading) {
    return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="container mt-4">
      <h2>Summary Report</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Department</th>
            <th>Total Trackers</th>
            <th>Unseen</th>
            <th>Unseen &gt; 1 Day</th>
            <th>Status Breakdown</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(report.departmentSummary).map(([department, data]) => (
            <tr key={department}>
              <td>{department}</td>
              <td>{data.total}</td>
              <td>{data.unseen}</td>
              <td>{data.unseenMoreThanDay}</td>
              <td>
                {Object.entries(data.statuses).map(([status, count]) => (
                  <div key={status}>
                    {status}: {count}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default DTSMonitorDashboard