type FooterProps = {
  projectName: string;
  teamName: string;
};

function Footer({ projectName, teamName }: FooterProps) {
  return (
    <footer>
      <p>
        Ada C24 Project: {projectName} | Team: @{teamName}
      </p>
    </footer>
  );
}

export default Footer;
