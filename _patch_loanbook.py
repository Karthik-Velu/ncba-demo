#!/usr/bin/env python3
import re

fpath = '/Users/karthikvelu/ncba-demo/src/app/nbfi/[id]/loan-book/page.tsx'
with open(fpath, 'r') as f:
    content = f.read()

old = """            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  Awaiting upload from{' '}
                  <span className="font-medium">{nbfi.name}</span> via their
                  portal. Once they submit, the data will appear here
                  automatically.
                </p>
              </div>
            )}"""

new = """            ) : (
              <div className="space-y-4">
                {inviteSent ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">Invite sent successfully</p>
                        <p className="text-xs text-green-700 mt-1">
                          A secure upload link was sent to <span className="font-medium">{inviteSent.name}</span> ({inviteSent.email}) on {inviteSent.date}.
                          They can upload the loan book from their portal login.
                        </p>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-amber-800">
                        Awaiting upload from <span className="font-medium">{inviteSent.name}</span> via portal.
                        Data will appear here automatically once submitted.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Invite an NBFI user to upload their loan book directly through the partner portal.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
                        <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
                          placeholder="e.g. Alice Wanjiku"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                        <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                          placeholder="e.g. alice@premiercredit.co.ke"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!inviteName.trim() || !inviteEmail.trim()) return;
                        setInviteSending(true);
                        setTimeout(() => {
                          setInviteSending(false);
                          setInviteSent({ name: inviteName.trim(), email: inviteEmail.trim(), date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
                        }, 1500);
                      }}
                      disabled={inviteSending || !inviteName.trim() || !inviteEmail.trim()}
                      className="px-4 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#004d99] disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {inviteSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {inviteSending ? 'Sending invite...' : 'Send Portal Invite'}
                    </button>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-700">
                        The NBFI user will receive a secure link to access the partner portal where they can upload
                        the loan book file, configure SFTP, and manage required documents.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}"""

if old in content:
    content = content.replace(old, new)
    with open(fpath, 'w') as f:
        f.write(content)
    print("Patch applied successfully")
else:
    print("ERROR: Old string not found")
    # Try to find a nearby match
    idx = content.find('Awaiting upload from')
    if idx >= 0:
        print(f"  Found 'Awaiting upload from' at position {idx}")
        print(f"  Context: ...{content[idx-100:idx+200]}...")
