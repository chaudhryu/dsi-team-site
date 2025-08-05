export const getMsGraphMe = async (token:string) => {
    const headers = new Headers()
    headers.append('Authorization', `Bearer ${token}`)
  
    return fetch(`https://graph.microsoft.com/v1.0/me`, {
      method: 'GET',
      headers,
    }).then((response) => response.json())
  }
  