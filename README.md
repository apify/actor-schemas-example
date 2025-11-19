# StoryMaker 2025 — Actor Schemas Example

This repository demonstrates how an Apify Actor evolves from a simple script into a fully-featured app using **eight schema levels**.  
Each commit in this repo corresponds to one level described in the blog post **“Why you should be using Actor schemas”**.

The Actor itself — *StoryMaker 2025* — generates book chapters based on user input (series title, character description, etc.).

---

## Schema Levels (Commit-by-Commit)

### **Level 0 — Basic `actor.json`**
Minimal Actor with no UI, no validation, no structured output.

### **Level 1 — `input_schema.json`**
Adds user interface + input validation.

### **Level 2 — Dataset views**
`dataset_schema.json` introduces structured dataset output (tables, images, links).

### **Level 3 — Dataset fields validation**
Adds validation of dataset items and automatic field statistics.

### **Level 4 — `web_server_schema.json`**
Defines an OpenAPI schema for the Actor’s HTTP server.

### **Level 5 — `key_value_store_schema.json`**
Organizes the Actor’s Key-Value Store into collections (final, draft, images).

### **Level 6 — `output_schema.json`**
Transforms the Output tab into a clean dashboard linking datasets and KVS content.

### **Level 7 — Live status page**
Actor writes a dynamic `status.html` and exposes it in the Output tab.

### **Level 8 — Interactive mode**
Actor hosts a web UI and surfaces the live URL via `containerRunUrl`.


