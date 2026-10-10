# vidIQ source-only visual analysis — XrQjCfUwXSw

Automated tool output, requires validation. Job job_7b194c26-0aa4-4ad2-ba94-a75a6fe9d32b; 2026-10-10. The long English video is a second request after the first report mismatched duration and game.

Here is a structured walkthrough of the video.

### Scene 1: Reconnaissance on Target Company & Social Media
**(00:00-01:59):** Following the channel intro, the player opens the in-game browser on the virtual desktop to search "Twotter" for Interpol connections. They locate the social media profile for "The Blue Table Bistro" and inspect recent corporate posts. A terminal session using the OSINT information gathering tool `LYNX` is initiated to collect server and domain details about the bistro.

### Scene 2: Subdomain Enumeration and Vulnerability Scanning
**(01:59-03:08):** In the terminal, the player executes `subfinder` against `thebluetable.com`, discovering multiple subdomains including `crm.thebluetable.com`. They run `nuclei` and `nmap` port scans to profile the target's services, revealing an open HTTP port running an Apache web server.

### Scene 3: SQL Injection on CRM Portal to Identify Target
**(03:08-04:31):** The player uses `sqlmap` to perform a SQL injection attack against `crm.thebluetable.com` and dumps the backend `customers` database table. Examining the exfiltrated employee records, they pinpoint Andrea Siebert, whose job role corresponds to an executive secretary at Interpol. Running `LYNX` on Andrea extracts her email address, social media handle, and personal habits.

### Scene 4: Social Media Profiling of Andrea Siebert
**(04:31-05:13):** Navigating back to Twotter, the player searches for `@andrea_siebert` to view her public feed. They discover posts showing her passport and discussing an upcoming flight vacation. This information provides the context needed to construct a convincing phishing pretext.

### Scene 5: Generating Malicious Office Macro in Metasploit
**(05:13-06:26):** Opening a new terminal, the player launches Metasploit Framework and searches for Office Word macro exploits (`office_word_macro`). They configure the module's target payload to `windows/meterpreter/reverse_tcp` to prepare a trojanized document.

### Scene 6: Router Password Cracking and Port Forwarding Configuration
**(06:26-08:58):** The player browses `HackDB` to download a router password cracker tool (`fwr.py`) and executes it against their local TP-Link router gateway. After obtaining the admin credentials, they log into the router's web portal (`192.168.1.1`) and add a custom port forwarding rule mapping external port `4444` to their local machine IP.

### Scene 7: Finalizing Payload & Starting Reverse Handler
**(08:58-10:10):** Returning to Metasploit, the player sets `LHOST` to their network IP, runs the exploit module to generate the malicious `.docm` payload, and starts the background reverse TCP listener (`handler`). In the file explorer, they rename the created payload file to `flyair.docm` to fit the airline travel pretext.

### Scene 8: Spear-Phishing Email Delivery
**(10:10-11:55):** The player accesses their GoMail webmail account and drafts a fraudulent spear-phishing email disguised as FlyAir Customer Support addressed to Andrea Siebert. The email claims there is an urgent flight document issue, instructs her to open the attached `flyair.docm` file, and is sent off to await the victim's connection.

---

### Summary
- **Core Thesis:** The video provides a complete step-by-step walkthrough of "The Journalist's Sister Part 10," demonstrating simulated cyber reconnaissance, web exploitation, and spear-phishing attacks.
- **Structure:** Follows a standard penetration testing methodology: OSINT gathering $\rightarrow$ subdomain discovery $\rightarrow$ database exfiltration via SQLi $\rightarrow$ weaponization with Metasploit $\rightarrow$ social engineering delivery.
- **Standout Moments:** Successfully exfiltrating the bistro's customer CRM database with `sqlmap` and tailoring the malicious macro document's lure around real travel details extracted from the target's social media feed.
