export const formatDate = (isoString)=> {
  if (!isoString) {
    return ''; 
  }
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return ''; 
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Return the date in yyyy-MM-dd format
  return `${year}-${month}-${day}`;
  //return `${month}-${day}-${year}`;
}
