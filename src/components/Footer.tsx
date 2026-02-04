type FooterProps = {
  projectName: string;
  teamMembers?: string[];
};

function Footer({ projectName, teamMembers = [] }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  const formatTeamMembers = (members: string[]) => {
    if (members.length === 0) return '';
    if (members.length === 1) return members[0];
    if (members.length === 2) return `${members[0]} & ${members[1]}`;
    
    const lastMember = members[members.length - 1];
    const otherMembers = members.slice(0, -1).join(', ');
    return `${otherMembers} & ${lastMember}`;
  };

  return (
    <footer style={styles.footer}>
      <p style={styles.text}>
        @Ada C24 {projectName} © {currentYear} | Made by {formatTeamMembers(teamMembers)}
      </p>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #d2d2d7',
    padding: '16px 0',
    marginTop: '32px',
    textAlign: 'center' as const,
  },
  text: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
    fontWeight: '400' as const,
  },
};

export default Footer;
