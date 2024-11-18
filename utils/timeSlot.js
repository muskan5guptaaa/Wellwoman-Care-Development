const timeSlots = [];
      let currentTime = startTime;
      while (currentTime < endTime) {
        const nextSlot = new Date(currentTime.getTime() + 30 * 60000); // Add 30 minutes
        timeSlots.push(
          `${currentTime.toLocaleTimeString([], 
          { hour: '2-digit', minute: '2-digit' })} - ${nextSlot.toLocaleTimeString([], 
            {
            hour: '2-digit', minute: '2-digit' 
            }
        )}`
        );
        currentTime = nextSlot;
      }
  

      