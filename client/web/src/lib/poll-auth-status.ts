const pollAuthStatus = async (email: string) => {
  try {
    const response = await fetch("http://localhost:4000/api/auth/poll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // { status: "pending" | "validated" | "not_started" }
  } catch (error) {
    console.error("Polling error:", error);
    return { status: "error" };
  }
};

export default pollAuthStatus;
