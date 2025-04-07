import { useState } from "react";
import axios from "axios";

const TrackerForm = () => {
  const [formData, setFormData] = useState({
    fromName: "",
    documentTitle: "",
    dateReceived: "",
    receivingDepartment: "",
    status: "pending",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("fromName", formData.fromName);
    data.append("documentTitle", formData.documentTitle);
    data.append("dateReceived", formData.dateReceived);
    data.append("recipient[0][receivingDepartment]", formData.receivingDepartment);
    data.append("recipient[0][status]", formData.status);
    data.append("file", formData.file);

    try {
      const response = await axios.post("http://localhost:3004/trackers/new", data, {
        headers: {
          Authorization:
            "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NzkxOTdiMjUwNGRmNWIwYTk2NWE3YTkiLCJ1c2VybmFtZSI6ImR0c3N1cGVyYWRtaW4iLCJkZXB0SWQiOnsiX2lkIjoiNjczZTg2YmUzMjA2M2E1Y2QzNDEyN2RiIiwiZGVwdENvZGUiOjEwMDEsImRlcHROYW1lIjoiU3VwZXJhZG1pbiBEZXBhcnRtZW50IiwiY3JlYXRlZEF0IjoiMjAyNC0xMS0yMVQwMTowMjo1NC44NzhaIiwidXBkYXRlZEF0IjoiMjAyNC0xMS0yMVQwMTowMjo1NC44NzhaIiwiX192IjowfSwidXNlcnJvbGUiOiJzdXBlcmFkbWluIiwiaWF0IjoxNzQwMDM1Njg2LCJleHAiOjE3NDAxMjIwODZ9.j9AZZ8g8vCdd5YxLDcR0FE-sbswJjuBThFboCrXerfU",
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Success:", response.data);
      alert("Tracker submitted successfully!");
    } catch (error) {
      console.error("Error submitting tracker:", error);
      alert("Submission failed.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 border rounded shadow-lg">
      <h2 className="text-xl font-bold mb-4">Create New Tracker</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="fromName"
          placeholder="From Name"
          value={formData.fromName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="documentTitle"
          placeholder="Document Title"
          value={formData.documentTitle}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="date"
          name="dateReceived"
          value={formData.dateReceived}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          name="receivingDepartment"
          placeholder="Receiving Department ID"
          value={formData.receivingDepartment}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="file"
          name="file"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default TrackerForm;
